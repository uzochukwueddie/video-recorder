import { Platform } from '@ionic/angular';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { StreamingMedia, StreamingVideoOptions } from '@ionic-native/streaming-media/ngx';

import { VideoService } from 'src/app/services/video.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  videos = [];
  lastModifiedVideo: any;
  isEmpty = true;
  isNotScrolling = true;

  subscription: Subscription;

  constructor(
    private videoService: VideoService,
    private platform: Platform,
    private streamingMedia: StreamingMedia
  ) {
    // this.platform.ready().then(() => {
    //   this.captureVideo();
    // });
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.getVideos();
    });
  }

  ngAfterViewInit() {
    this.subscription = this.videoService.videoEmitEvent
      .subscribe(data => {
        this.videos.length = 0;
        this.isEmpty = true;
        setTimeout(() => {
          this.videos = this.sortByDate(data);
          this.lastModifiedVideo = this.videos[0];
          this.isEmpty = false;
        }, 2000);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getVideos() {
    this.videoService.getVideosInDir()
      .then((data) => {
        if (data.length > 0) {
          this.videos = this.sortByDate(data);
          this.lastModifiedVideo = this.videos[0];
        }

        if (this.videos.length === 0) {
          setTimeout(() => {
            this.isEmpty = false;
          }, 2000);
        } else {
          this.isEmpty = false;
        }
      });
  }

  captureVideo() {
    this.platform.ready().then(() => {
      this.videoService.captureVideo();
    });
  }

  playVideo(videoFile) {
    const options: StreamingVideoOptions = {
      successCallback: () => { console.log('Video played'); },
      errorCallback: (e) => { console.log(e); },
      orientation: 'portrait',
      shouldAutoClose: true,
      controls: true
    };
    this.streamingMedia.playVideo(videoFile, options);
  }

  onScroll(event) {
    if (event.type === 'ionScroll') {
      this.isNotScrolling = false;
    }
  }

  onScrollEnd(event) {
    if (event.type === 'ionScrollEnd') {
      this.isNotScrolling = true;
    }
  }

  sortByDate(array) {
    return array.sort((a: any, b: any) => {
      return b.modified - a.modified;
    });
  }

}
