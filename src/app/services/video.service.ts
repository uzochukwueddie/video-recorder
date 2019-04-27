import { Platform } from '@ionic/angular';
import { Injectable, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import {
  MediaCapture,
  MediaFile,
  CaptureVideoOptions
} from '@ionic-native/media-capture/ngx';
import { File } from '@ionic-native/file/ngx';
import { VideoEditor, CreateThumbnailOptions } from '@ionic-native/video-editor/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';


@Injectable({
  providedIn: 'root'
})
export class VideoService {
  videoEmitEvent = new EventEmitter<MediaFile[]>();

  constructor(
    private mediaCapture: MediaCapture,
    private file: File,
    private platform: Platform,
    private router: Router,
    private videoEditor: VideoEditor,
    private webView: WebView
  ) { }

  captureVideo() {
    if (this.platform.is('android')) {
      this.file.checkDir(this.file.externalRootDirectory, 'VideoRecorder')
        .then(async () => {
          await this.videoCapture();
        })
        .catch(() => {
          this.file.createDir(this.file.externalRootDirectory, 'VideoRecorder', false)
          .then (async () => {
              await this.videoCapture();
            })
            .catch((error) => {
              console.log('Directory not created' + error);
            });
        });
    }
  }

  async videoCapture() {
    const options: CaptureVideoOptions = {
      limit: 1
    };
    this.mediaCapture.captureVideo(options)
      .then(async (res: MediaFile[]) => {
        if (res.length > 0) {
          const path = res[0].fullPath.split('/');
          const fileName = path.splice(-1, 1)[0];
          const dirPath = this.file.externalRootDirectory + '/VideoRecorder';
          const newFileName = fileName.split('.')[0];
          await this.file.moveFile(path.join('/'), fileName, dirPath, newFileName + '.mp4');
          await this.getVideosInDir();
        }
      })
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch(err => console.log(err));
  }

  async getVideosInDir() {
    if (this.platform.is('android')) {
      const videosArray = [];
      const files = await this.file.listDir(this.file.externalRootDirectory, 'VideoRecorder');
      for (const item of files) {
        const itemName = item.name.split('.')[0];
        const option: CreateThumbnailOptions = {
          fileUri: `${this.file.externalRootDirectory}/VideoRecorder/${item.name}`,
          width: 160,
          height: 120,
          outputFileName: itemName,
          quality: 100
        };
        const result = await this.videoEditor.createThumbnail(option);
        const file: any = await this.getFile(item);
        videosArray.push({
          name: file.name,
          modified: new Date(file.lastModifiedDate),
          location: item.nativeURL.replace(/file:\/\//g, ''),
          thumbnailURL: this.webView.convertFileSrc(`file://${result}`)
        });
      }
      this.videoEmitEvent.emit(videosArray);
      return videosArray;
    }
  }

  async getFile(fileEntry) {
    try {
      return await new Promise((resolve, reject) => fileEntry.file(resolve, reject));
    } catch (err) {
      console.log(err);
    }
  }

}
