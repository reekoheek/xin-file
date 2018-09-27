import { define, Component } from '@xinix/xin';

const globalPools = [];

export class FilePool extends Component {
  static get default () {
    return globalPools[0];
  }

  get props () {
    return Object.assign({}, super.props, {
      name: {
        type: String,
      },

      baseUrl: {
        type: String,
        value: window.location.origin,
        observer: 'baseUrlChanged(baseUrl)',
      },

      headers: {
        type: Object,
      },
    });
  }

  baseUrlChanged (baseUrl) {
    this._baseUrl = (new window.URL(baseUrl, window.location.origin).href).replace(/\/+$/, '');
  }

  getUrl (url = '') {
    if (url instanceof window.URL) {
      return url;
    }

    return url.startsWith('/') ? ((this._baseUrl || '') + url) : new window.URL(url, this._baseUrl).href;
  }

  async upload (files = [], { bucket = '/' } = {}) {
    let data = new window.FormData();
    files.forEach(file => {
      data.append('file', file);
    });

    let resp = await this.fetch(`/upload?bucket=${bucket}`, {
      method: 'POST',
      body: data,
    });

    if (resp.status !== 200) {
      throw new Error('Fail uploading');
    }

    return resp.json();
  }

  fetch (url, options = {}) {
    const headers = Object.assign({}, this.headers, options.headers);
    delete headers['Content-Type'];

    options = Object.assign(options, { headers });

    return window.fetch(this.getUrl(url), options);
  }

  attached () {
    super.attached();

    if (!this.name) {
      this.name = `filepool-${this.__id}`;
    }

    globalPools.push(this);
  }

  detached () {
    super.detached();

    const index = globalPools.indexOf(this);
    if (index !== -1) {
      globalPools.splice(index, 1);
    }
  }
}

define('file-pool', FilePool);
