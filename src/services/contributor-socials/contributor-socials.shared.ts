// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ContributorSocials,
  ContributorSocialsData,
  ContributorSocialsPatch,
  ContributorSocialsQuery,
  ContributorSocialsService,
} from './contributor-socials.class'

export type {
  ContributorSocials,
  ContributorSocialsData,
  ContributorSocialsPatch,
  ContributorSocialsQuery,
}

export type ContributorSocialsClientService = Pick<
  ContributorSocialsService<Params<ContributorSocialsQuery>>,
  (typeof contributorSocialsMethods)[number]
>

export const contributorSocialsPath = 'contributor-socials'

export const contributorSocialsMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const contributorSocialsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(
    contributorSocialsPath,
    connection.service(contributorSocialsPath),
    {
      methods: contributorSocialsMethods,
    },
  )
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [contributorSocialsPath]: ContributorSocialsClientService
  }
}
