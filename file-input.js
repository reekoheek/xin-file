import { define, Component } from '@xinix/xin';
import { FilePool } from './file-pool';

const { File } = window;

export class FileInput extends Component {
  get template () {
    return require('./file-input.html');
  }

  get props () {
    return Object.assign({}, super.props, {
      value: {
        type: Array,
        value: () => ([]),
        notify: true,
      },

      pool: {
        type: Object,
      },

      bucket: {
        type: String,
        value: '/',
      },
    });
  }

  attached () {
    super.attached();

    this.fileInputChanged = this.fileInputChanged.bind(this);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.setAttribute('multiple', 'multiple');

    this.fileInput.addEventListener('change', this.fileInputChanged);
  }

  detached () {
    this.fileInput.removeEventListener('change', this.fileInputChanged);
    this.fileInput = null;
  }

  getPool () {
    return this.pool || FilePool.default;
  }

  fileInputChanged (evt) {
    let target = evt.target;

    this.set('value', this.value || []);

    let files = Array.from(target.files);
    files.forEach(file => {
      if (this.value.find(f => f.name === file.name)) {
        return;
      }
      this.push('value', file);
    });

    target.value = '';

    this.async(async () => {
      try {
        let resultFiles = await this.getPool().upload(files, this);
        let value = this.value.map(file => {
          if (file instanceof File) {
            let resultFile = resultFiles.find(rf => rf.name === file.name);
            if (resultFile) {
              file = resultFile;
            }
          }
          return file;
        });

        this.set('value', value);
      } catch (err) {
        this.set('error', err);
        this.fire('error', err);
      }
    }, 10);
  }

  computeUploadingText (hash) {
    if (!hash) {
      return '(uploading)';
    }
  }

  selectClicked (evt) {
    evt.preventDefault();

    this.fileInput.click();
  }

  deleteClicked (evt, index) {
    evt.preventDefault();

    let value = this.value.map(f => f);
    value.splice(index, 1);

    this.set('value', value);
  }
}

define('file-input', FileInput);
