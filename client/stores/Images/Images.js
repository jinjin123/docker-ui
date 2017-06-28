import axios from 'axios'
import {sortBy} from 'lodash'
import {action, observable} from 'mobx'
import moment from 'moment'

const sizeOf = bytes => {
  if (Number(bytes) === 0) { return '0.00 B' }
  const e = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes/Math.pow(1024, e)).toFixed(2)+' '+' KMGTP'.charAt(e)+'B'
}

export default class Images {
  @observable error = null
  @observable images = []
  @observable inspect = null

  constructor(appStore) {
    this.appStore = appStore
  }

  @action setError = message => {
    this.error = message
  }

  @action destroyImage = id => {
    axios.delete(`/api/v1/images/${id}`)
    .then(() => {
      this.loadImages()
    })
    .catch(err => {
      this.setError(err.response.data.message)
    })
  }

  @action inspectImage = id => {
    axios.get(`/api/v1/images/${id}`)
    .then(res => {
      this.inspect = res.data
    })
    .catch(err => {
      this.setError(err.response.data.message)
    })
  }

  @action loadImages = () => {
    axios.get('/api/v1/images')
    .then(res => {
      this.images = sortBy(res.data, image => -image.Created).map(image => ({
        repository: image.RepoTags ? image.RepoTags[0].split(':')[0] : image.RepoDigests ? image.RepoDigests[0].split('@')[0] : '<none>',
        tag: image.RepoTags ? image.RepoTags[0].split(':')[1] : '<none>',
        image: image.Id.split(':')[1].substr(0, 12),
        created: moment.unix(image.Created).fromNow(),
        size: sizeOf(image.Size),
      }))
    })
    .catch(err => {
      this.setError(err.response.data.message)
    })
  }

  @action pruneImages = () => {
    axios.post('/api/v1/images/prune')
    .then(() => {
      this.loadImages()
    })
    .catch(err => {
      this.setError(err.response.data.message)
    })
  }
}
