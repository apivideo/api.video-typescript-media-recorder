import { ProgressiveUploaderOptionsWithUploadToken, ProgressiveUploaderOptionsWithAccessToken, VideoUploadResponse } from "@api.video/video-uploader";
import { VideoUploadError } from "@api.video/video-uploader/dist/src/abstract-uploader";
export { ProgressiveUploaderOptionsWithAccessToken, ProgressiveUploaderOptionsWithUploadToken, VideoUploadResponse } from "@api.video/video-uploader";
export { VideoUploadError } from "@api.video/video-uploader/dist/src/abstract-uploader";
export interface Options {
    onError?: (error: VideoUploadError) => void;
}
declare type EventType = "error" | "recordingStopped";
export declare class ApiVideoMediaRecorder {
    private mediaRecorder;
    private streamUpload;
    private onVideoAvailable?;
    private onStopError?;
    private eventTarget;
    constructor(mediaStream: MediaStream, options: Options & (ProgressiveUploaderOptionsWithUploadToken | ProgressiveUploaderOptionsWithAccessToken));
    addEventListener(type: EventType, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions | undefined): void;
    private onDataAvailable;
    private dispatch;
    start(options?: {
        timeslice?: number;
    }): void;
    getMediaRecorderState(): RecordingState;
    stop(): Promise<VideoUploadResponse>;
    pause(): void;
    private stopMediaRecorder;
    private getSupportedMimeTypes;
}
