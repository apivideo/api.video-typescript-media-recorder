import { ProgressiveUploader, ProgressiveUploaderOptionsWithUploadToken, ProgressiveUploaderOptionsWithAccessToken, VideoUploadResponse } from "@api.video/video-uploader";

export { ProgressiveUploaderOptionsWithAccessToken, ProgressiveUploaderOptionsWithUploadToken } from "@api.video/video-uploader";

export interface Options {
    title?: string;
};

export class ApiVideoMediaRecorder {
    private mediaRecorder: MediaRecorder;
    private streamUpload: ProgressiveUploader;
    private onVideoAvailable?: (video: VideoUploadResponse) => void;

    constructor(mediaStream: MediaStream, options: ProgressiveUploaderOptionsWithUploadToken | ProgressiveUploaderOptionsWithAccessToken) {
        const supportedTypes = this.getSupportedMimeTypes();
        if(supportedTypes.length === 0) {
            throw new Error("No compatible supported video mime type");
        }
        this.mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: supportedTypes[0],
        });

        this.streamUpload = new ProgressiveUploader({
            preventEmptyParts: true,
            ...options
        });

        this.mediaRecorder.ondataavailable = (e) => this.onDataAvailable(e);
    }

    private onDataAvailable(ev: BlobEvent) {
        const isLast = (ev as any).currentTarget.state === "inactive";
        if(isLast) {
            this.streamUpload.uploadLastPart(ev.data).then((video) => {
                if(this.onVideoAvailable) {
                    this.onVideoAvailable(video);
                }
            });
        } else {
            this.streamUpload.uploadPart(ev.data);
        }
    }

    public start(options?: { timeslice?: number }) {
        this.mediaRecorder.start(options?.timeslice || 5000);
    }

    public stop(): Promise<VideoUploadResponse> {
        this.mediaRecorder.stop();
        return new Promise((resolve, reject) => {
            this.onVideoAvailable = (v) => resolve(v)
        })
    }

    public pause() {
        this.mediaRecorder.pause();
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
              if(MediaRecorder.isTypeSupported(variation))
                  supportedTypes.push(variation);
            })
          });
        });
        return supportedTypes;
      }
}