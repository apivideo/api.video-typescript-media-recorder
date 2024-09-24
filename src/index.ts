import {
  ProgressiveUploader,
  ProgressiveUploaderOptionsWithAccessToken,
  ProgressiveUploaderOptionsWithUploadToken,
  VideoUploadResponse,
} from "@api.video/video-uploader";
import { VideoUploadError } from "@api.video/video-uploader/dist/src/abstract-uploader";

export {
  ProgressiveUploaderOptionsWithAccessToken,
  ProgressiveUploaderOptionsWithUploadToken,
  VideoUploadResponse,
} from "@api.video/video-uploader";
export { VideoUploadError } from "@api.video/video-uploader/dist/src/abstract-uploader";

export interface Options {
  onError?: (error: VideoUploadError) => void;
  generateFileOnStop?: boolean;
  mimeType?: string;
}

let PACKAGE_VERSION = "";
try {
  // @ts-ignore
  PACKAGE_VERSION = __PACKAGE_VERSION__ || "";
} catch (e) {
  // ignore
}

type EventType = "error" | "recordingStopped" | "videoPlayable";

export class ApiVideoMediaRecorder {
  private mediaRecorder: MediaRecorder;
  private streamUpload: ProgressiveUploader;
  private onVideoAvailable?: (video: VideoUploadResponse) => void;
  private onStopError?: (error: VideoUploadError) => void;
  private eventTarget: EventTarget;
  private debugChunks: Blob[] = [];
  private generateFileOnStop: boolean;
  private mimeType: string;
  private previousPart: Blob | null = null;

  constructor(
    mediaStream: MediaStream,
    options: Options &
      (
        | ProgressiveUploaderOptionsWithUploadToken
        | ProgressiveUploaderOptionsWithAccessToken
      )
  ) {
    this.eventTarget = new EventTarget();
    this.generateFileOnStop = options.generateFileOnStop || false;

    const findBestMimeType = () => {
      const supportedTypes = ApiVideoMediaRecorder.getSupportedMimeTypes();
      if (supportedTypes.length === 0) {
        throw new Error("No compatible supported video mime type");
      }
      return supportedTypes[0];
    };

    this.mimeType = options.mimeType || findBestMimeType();

    this.mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: this.mimeType,
    });

    this.mediaRecorder.addEventListener("stop", () => {
      const stopEventPayload = this.generateFileOnStop
        ? { file: new Blob(this.debugChunks, { type: this.mimeType }) }
        : {};
      this.dispatch("recordingStopped", stopEventPayload);
    });

    this.streamUpload = new ProgressiveUploader({
      preventEmptyParts: true,
      ...options,
      origin: {
        sdk: {
          name: "media-recorder",
          version: PACKAGE_VERSION,
        },
        ...options.origin,
      },
    });

    this.mediaRecorder.ondataavailable = (e) => this.onDataAvailable(e);

    this.mediaRecorder.onstop = async () => {
      if (this.previousPart) {
        const video = await this.streamUpload.uploadLastPart(this.previousPart);
        if (this.onVideoAvailable) {
          this.onVideoAvailable(video);
        }
      } else if (this.onStopError) {
        const error: VideoUploadError = {
          raw: "No data available to upload",
          title: "No data available to upload",
        };
        this.onStopError(error);
      }
    };
    (window as any).mediaRecorder = this.mediaRecorder;
  }

  public addEventListener(
    type: EventType,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions | undefined
  ): void {
    if (type === "videoPlayable") {
      this.streamUpload.onPlayable((video) =>
        this.dispatch("videoPlayable", video)
      );
    }
    this.eventTarget.addEventListener(type, callback, options);
  }

  private async onDataAvailable(ev: BlobEvent) {
    const isLast = (ev as any).currentTarget.state === "inactive";
    try {
      if (this.generateFileOnStop) {
        this.debugChunks.push(ev.data);
      }
      if (this.previousPart) {
        const toUpload = new Blob([this.previousPart]);
        this.previousPart = ev.data;
        await this.streamUpload.uploadPart(toUpload);
      } else {
        this.previousPart = ev.data;
      }
    } catch (error) {
      if (!isLast) this.mediaRecorder.stop();
      this.dispatch("error", error);
      if (this.onStopError) this.onStopError(error as VideoUploadError);
    }
  }

  private dispatch(type: EventType, data: any): boolean {
    return this.eventTarget.dispatchEvent(
      Object.assign(new Event(type), { data })
    );
  }

  public start(options?: { timeslice?: number }) {
    if (this.getMediaRecorderState() === "recording") {
      throw new Error("MediaRecorder is already recording");
    }
    this.mediaRecorder.start(options?.timeslice || 5000);
  }

  public getMediaRecorderState(): RecordingState {
    return this.mediaRecorder.state;
  }

  public stop(): Promise<VideoUploadResponse> {
    return new Promise((resolve, reject) => {
      if (this.getMediaRecorderState() === "inactive") {
        reject(new Error("MediaRecorder is already inactive"));
      }
      this.mediaRecorder.stop();
      this.onVideoAvailable = (v) => resolve(v);
      this.onStopError = (e) => reject(e);
    });
  }

  public pause() {
    if (this.getMediaRecorderState() !== "recording") {
      throw new Error("MediaRecorder is not recording");
    }
    this.mediaRecorder.pause();
  }

  public static getSupportedMimeTypes() {
    const VIDEO_TYPES = ["mp4", "webm", "ogg", "x-matroska"];
    const VIDEO_CODECS = [
      "vp9,opus",
      "vp8,opus",
      "vp9",
      "vp9.0",
      "vp8",
      "vp8.0",
      "h264",
      "h.264",
      "avc1",
      "av1",
      "h265",
      "h.265",
    ];

    const supportedTypes: string[] = [];
    VIDEO_TYPES.forEach((videoType) => {
      const type = `video/${videoType}`;
      VIDEO_CODECS.forEach((codec) => {
        const variations = [
          `${type};codecs=${codec}`,
          `${type};codecs:${codec}`,
          `${type};codecs=${codec.toUpperCase()}`,
          `${type};codecs:${codec.toUpperCase()}`,
          `${type}`,
        ];
        for (const variation of variations) {
          if (MediaRecorder.isTypeSupported(variation)) {
            supportedTypes.push(variation);
            break;
          }
        }
      });
    });
    return supportedTypes;
  }
}
