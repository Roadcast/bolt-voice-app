import { Component } from '@angular/core';
import {UrlDataService} from "../url-data.service";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private url: UrlDataService) {}

  scan() {

  }
}
