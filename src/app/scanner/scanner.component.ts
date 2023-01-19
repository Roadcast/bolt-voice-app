import {AfterViewInit, Component, OnInit} from '@angular/core';
import {BrowserMultiFormatReader} from "@zxing/library";
import AgoraRTC, {IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack} from 'agora-rtc-sdk-ng';
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss'],
})
export class ScannerComponent implements OnInit, AfterViewInit {
  videoDevices: MediaDeviceInfo[] = [];
  scanResult: any;
  codeReader = new BrowserMultiFormatReader();
  selectedDevice: any;
  toggleText: boolean = true;
  errMessage: string = '';
  client: IAgoraRTCClient | undefined;
  rtc = {
    // For the local client.
    client: null, // For the local audio and live-video tracks.
    localAudioTrack: null, localVideoTrack: null,
  };

  localAudioTrack: IMicrophoneAudioTrack | undefined;
  private options = {
    appId: '',
    token: '',
    channel: '123',
  };
  riderId: any;
  remoteCalls: string[] = [];
  join = true;
  unique_Id: any;
  body: any;
  time = 0;
  second = 0;
  min = 0;
  callertime: any;
  constructor() { }

  async ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    this.unique_Id = urlParams.get('voice');
    const api_url = environment.apiUrl;
    fetch(api_url + 'auth/get_agora_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        unique_id: this.unique_Id,
      })
    }).then(async( res) => {
      const respData  =  await res.json();
      this.options.appId = respData.app_id;
      this.options.token = respData.token;
    });
  }

  ngAfterViewInit() {
    // this.codeReader = new BrowserMultiFormatReader();
    // this.codeReader
    //   .listVideoInputDevices()
    //   .then(videoInputDevices => {videoInputDevices.forEach(device => {
    //       this.videoDevices.push(device);
    //       console.log('device', device)
    //   });
    //     console.log('videoInputDevices', videoInputDevices);
    //     console.log('this.videoDevices', this.videoDevices)
    //   })
    //   .catch(err => console.error(err));
    // if (this.toggleText) {
    //   this.decodeContinuously(this.codeReader, this.selectedDevice);
    // } else {
    //   try {
    //     const element = this.renderer.selectRootElement('#inputBox');
    //     setTimeout(() => element.setAttribute('readonly', 'readonly'), 0);
    //     setTimeout(() => element.focus(), 0);
    //     setTimeout(() => {
    //       element.removeAttribute('readonly');
    //     }, 100);
    //   } catch (e) { }
    // }
  }

  decodeContinuously(codeReader: BrowserMultiFormatReader, selectedDeviceId: any) {
    // codeReader.decodeFromInputVideoDeviceContinuously(selectedDeviceId, 'video', (result, err) => {
    //   console.log(result);
    //   if (result) {
    //     const resultValue = '' + result;
    //     this.scanResult = resultValue.replace('001S', '');
    //     console.log(' this.scanResult',  this.scanResult)
    //     this.close().then()
    //   }
    //
    //   if (err) {
    //     if (err instanceof NotFoundException) {
    //       this.errMessage = 'No QR code found.';
    //     }
    //
    //     if (err instanceof ChecksumException) {
    //       this.errMessage = 'A code was found, but it\'s read value was not valid.';
    //     }
    //
    //     if (err instanceof FormatException) {
    //       this.errMessage = 'A code was found, but it was in a invalid format.';
    //     }
    //   }
    // });
  }

   async voiceCall() {
    this.riderId = this.unique_Id;
     this.client = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'});
     await this.client.join(this.options.appId, this.riderId, this.options.token, 123);
     this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
     await this.client.publish([this.localAudioTrack]);
     console.log('this audio', this.localAudioTrack);
     const api_url = environment.apiUrl;
     fetch(api_url + 'auth/qr_scan_send_notification', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         // unique_id: '352503090285401',
          unique_id: this.unique_Id,
       })
     }).then(async( res) => {
       const riderData  =  await res.json();
       console.log(riderData);
     });
     this.join = false;
     this.client.on('user-published', async (user, mediaType) => {
       // Subscribe to a remote user.
       // @ts-ignore
       await this.client.subscribe(user, mediaType);
       console.log('subscribe success');
       // If the subscribed track is audio.
       if (mediaType === 'audio') {
         // Get `RemoteAudioTrack` in the `user` object.
         const remoteAudioTrack = user.audioTrack;
         // Play the audio track. No need to pass any DOM element.
         // @ts-ignore
         remoteAudioTrack.play();
         this.remoteCalls.push(user.uid.toString());
         if (this.remoteCalls.length !== 0){
      this.callertime =  setInterval(() =>
               this.startTime(),
             1000);
         }
       }
     });
     this.client.on('user-unpublished', user => {
       // @ts-ignore
       this.client.unsubscribe(user);
     });
     this.client.on('user-left', (user: IAgoraRTCRemoteUser, reason: string) => {
       if (reason === 'Quit') {
         this.leaveCall();
       }
     });
   }

  leaveCall() {
     this.localAudioTrack?.close();
     this.join = true;
     clearInterval(this.callertime);
     this.min = 0;
     this.second = 0;
    this.remoteCalls = [];
    // @ts-ignore
    this.client.remoteUsers.forEach(user => {
      const playerContainer = document.getElementById(user.uid.toString());
      console.log('player', playerContainer);
      if (playerContainer) {

        playerContainer.remove();
      } else {
        console.log('player not found');
      }
    })
    // @ts-ignore
    this.client.leave();
  }

  startTime() {
    this.second++
    if (this.second === 60){
       this.min += 1;
       this.second = 0;
    }
  }
}
