import { ProgressiveUploaderOptionsWithUploadToken, ProgressiveUploaderOptionsWithAccessToken } from "@api.video/video-uploader";
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
    stop(): Promise<unknown>;
    pause(): void;
    private getSupportedMimeTypes;
}
