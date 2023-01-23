import { ProgressiveUploader, ProgressiveUploaderOptionsWithAccessToken, ProgressiveUploaderOptionsWithUploadToken, VideoUploadResponse } from "@api.video/video-uploader";
import { VideoUploadError } from "@api.video/video-uploader/dist/src/abstract-uploader";

export { ProgressiveUploaderOptionsWithAccessToken, ProgressiveUploaderOptionsWithUploadToken, VideoUploadResponse } from "@api.video/video-uploader";
export { VideoUploadError } from "@api.video/video-uploader/dist/src/abstract-uploader";

export interface Options {
    onError?: (error: VideoUploadError) => void;
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

    constructor(mediaStream: MediaStream, options: Options & (ProgressiveUploaderOptionsWithUploadToken | ProgressiveUploaderOptionsWithAccessToken)) {
        this.eventTarget = new EventTarget();
        const supportedTypes = this.getSupportedMimeTypes();
        if (supportedTypes.length === 0) {
            throw new Error("No compatible supported video mime type");
        }
        this.mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: supportedTypes[0],
        });

        this.streamUpload = new ProgressiveUploader({
            preventEmptyParts: true,
            ...options,
            origin: {
                sdk: {
                    name: "media-recorder",
                    version: PACKAGE_VERSION
                },
                ...options.origin
            },
        });

        this.mediaRecorder.ondataavailable = (e) => this.onDataAvailable(e);
        (window as any).mediaRecorder = this.mediaRecorder;
    }

    public addEventListener(type: EventType, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions | undefined): void {
        if(type === "videoPlayable") {
            this.streamUpload.onPlayable((video) => this.dispatch("videoPlayable", video));
        }
        this.eventTarget.addEventListener(type, callback, options);
    }

    private async onDataAvailable(ev: BlobEvent) {
        const isLast = (ev as any).currentTarget.state === "inactive";
        try {
            if (isLast) {
                const video = await this.streamUpload.uploadLastPart(ev.data);

                if (this.onVideoAvailable) {
                    this.onVideoAvailable(video);
                }
            } else {
                await this.streamUpload.uploadPart(ev.data);
            }
        } catch (error) {
            if (!isLast) this.stopMediaRecorder();
            this.dispatch("error", error);
            if (this.onStopError) this.onStopError(error as VideoUploadError);
        }
    }

    private dispatch(type: EventType, data: any): boolean {
        return this.eventTarget.dispatchEvent(Object.assign(new Event(type), {data}));
    }

    public start(options?: { timeslice?: number }) {
        if(this.getMediaRecorderState() === "recording") {
            throw new Error("MediaRecorder is already recording");
        }
        this.mediaRecorder.start(options?.timeslice || 5000);
    }

    public getMediaRecorderState(): RecordingState {
        return this.mediaRecorder.state;
    }

    public stop(): Promise<VideoUploadResponse> {
        return new Promise((resolve, reject) => {
            if(this.getMediaRecorderState() === "inactive") {
                reject(new Error("MediaRecorder is already inactive"));
            }
            this.stopMediaRecorder();
            this.onVideoAvailable = (v) => resolve(v);
            this.onStopError = (e) => reject(e);
        })
    }

    public pause() {
        if(this.getMediaRecorderState() !== "recording") {
            throw new Error("MediaRecorder is not recording");
        }
        this.mediaRecorder.pause();
    }

    private stopMediaRecorder() {
        this.mediaRecorder.stop();
        this.dispatch("recordingStopped", {});
    }

    private getSupportedMimeTypes() {
        const VIDEO_TYPES = [
            "webm",
            "ogg",
            "mp4",
            "x-matroska"
        ];
        const VIDEO_CODECS = [
            "h264",
            "h.264",
            "vp9",
            "vp9.0",
            "vp8",
            "vp8.0",
            "avc1",
            "av1",
            "h265",
            "h.265",
            "opus",
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
                    `${type}`
                ]
                variations.forEach(variation => {
                    if (MediaRecorder.isTypeSupported(variation))
                        supportedTypes.push(variation);
                })
            });
        });
        return supportedTypes;
    }
}