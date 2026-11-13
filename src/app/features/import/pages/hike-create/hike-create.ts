import { Result } from '@core/error';
import { Component, signal } from '@angular/core';
import { TranslatePipe } from "@ngx-translate/core";
import { form, FormField } from '@angular/forms/signals';
import { NormalizedActivity } from '@import/models/gpx.model';
import { parse_gpx } from '@import/gpx/gpx-converter';
import { Decoder, Stream } from '@garmin/fitsdk';
import { parse_fit } from '@import/fit/fit-converter';

type ActivityFileType = 'gpx' | 'fit';

@Component({
  selector: 'app-hike-create',
  imports: [
    TranslatePipe
  ],
  templateUrl: './hike-create.html',
  styleUrl: './hike-create.scss',
})
export default class HikeCreate {
  fileError = signal<string | null>(null);
  normalisedActivity = signal<NormalizedActivity | null>(null);
  GPX_ROOT = /^\s*(?:<\?[\s\S]*?\?>\s*|<!--[\s\S]*?-->\s*|<!DOCTYPE[^>]*>\s*)*<gpx[\s>]/i;


  private readonly genericMimeTypes = ['', 'application/octet-stream'];
  private readonly allowedMimeTypes: Record<string, string[]> = {
    gpx: ['application/gpx+xml', 'application/xml', 'text/xml', 'gpx'],
    fit: ['application/vnd.ant.fit', 'application/fit', 'fit'],
  };

  model = signal<{ file: File | null }>({
    file: null,
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;

    if (file === null) {
      return
    }

    if (this.detectFileType(file) === null) {
      this.fileError.set(`import.only_certain_file_types_allowed`);
      return;
    }

    this.model.update(value => ({
      ...value,
      file,
    }));
  }

  async submit() {
    const file = this.model().file;
    const fileType = file ? await this.detectFileType(file) : null;

    if (!file || !fileType) {
      console.error('Only GPX or FIT files are allowed');
      return;
    }

    let normalizedActivityResult: Result<NormalizedActivity>;
    switch (fileType) {
      case 'gpx':
        normalizedActivityResult = await parse_gpx(file);
        console.log("End");
        break;
      case 'fit':
        normalizedActivityResult = await parse_fit(file);
        break;
    }

    if (!normalizedActivityResult.success) {
      this.fileError.set("PLEASE CHANGE: Normalised activtiy result is no succes");
      return
    }

    this.normalisedActivity.set(normalizedActivityResult.data);
    console.log(this.normalisedActivity())
  }


  private async detectFileType(file: File): Promise<ActivityFileType | null> {
    const head = await file.slice(0, 1024).arrayBuffer();

    if (Decoder.isFIT(Stream.fromArrayBuffer(head))) return 'fit';

    const text = new TextDecoder().decode(head);

    if (this.GPX_ROOT.test(text)) return 'gpx';
    return null;
  }
}
