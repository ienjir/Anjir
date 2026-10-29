import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { read } from 'node:fs';

@Component({
  selector: 'app-hike-create',
  imports: [
  ],
  templateUrl: './hike-create.html',
  styleUrl: './hike-create.scss',
})
export default class HikeCreate {
  model = signal<{ file: File | null }>({
    file: null,
  });

  fileForm = form(this.model);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;

    this.model.update(value => ({
      ...value,
      file,
    }));
  }

  submit(): void {
    const file = this.model().file;

    if (!file || file.type !== "application/gpx+xml") {
      console.error("Only GPX");
      return;
    }

    console.log('Selected file:', file);
    console.log('Filename:', file.name);
    console.log('Size:', file.size);
    console.log('MIME type:', file.type);

    const reader = new FileReader();
    reader.onload = () => {
      console.log("Loading");
    };
    reader.onerror = () => {
      console.error("Load error")
    };
    reader.readAsText(file);
  }
}
