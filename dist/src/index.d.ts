import { ProgressiveUploaderOptionsWithUploadToken, ProgressiveUploaderOptionsWithAccessToken, VideoUploadResponse } from "@api.video/video-uploader";
export { ProgressiveUploaderOptionsWithAccessToken, ProgressiveUploaderOptionsWithUploadToken } from "@api.video/video-uploader";
export interface Options {
    title?: string;
}
export declare class ApiVideoMediaRecorder {
    private mediaRecorder;
    private streamUpload;
    private onVideoAvailable?;
    constructor(mediaStream: MediaStream, options: ProgressiveUploaderOptionsWithUploadToken | ProgressiveUploaderOptionsWithAccessToken);
    private onDataAvailable;
    start(options?: {
        timeslice?: number;
    }): void;
    stop(): Promise<VideoUploadResponse>;
    pause(): void;
    private getSupportedMimeTypes;
}
