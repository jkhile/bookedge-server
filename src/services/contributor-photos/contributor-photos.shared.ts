// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ContributorPhotos,
  ContributorPhotosData,
  ContributorPhotosPatch,
  ContributorPhotosQuery,
  ContributorPhotosService,
} from './contributor-photos.class'

export type {
  ContributorPhotos,
  ContributorPhotosData,
  ContributorPhotosPatch,
  ContributorPhotosQuery,
}

export type ContributorPhotosClientService = Pick<
  ContributorPhotosService<Params<ContributorPhotosQuery>>,
  (typeof contributorPhotosMethods)[number]
>

export const contributorPhotosPath = 'contributor-photos'

export const contributorPhotosMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const contributorPhotosClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(contributorPhotosPath, connection.service(contributorPhotosPath), {
    methods: contributorPhotosMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [contributorPhotosPath]: ContributorPhotosClientService
  }
}
