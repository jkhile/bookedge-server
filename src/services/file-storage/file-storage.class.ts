// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type {
  Id,
  NullableId,
  Params,
  ServiceInterface,
} from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  FileStorage,
  FileStorageData,
  FileStoragePatch,
  FileStorageQuery,
} from './file-storage.schema'

export type { FileStorage, FileStorageData, FileStoragePatch, FileStorageQuery }

export interface FileStorageServiceOptions {
  app: Application
}

export interface FileStorageParams extends Params<FileStorageQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class FileStorageService<
  ServiceParams extends FileStorageParams = FileStorageParams,
> implements
    ServiceInterface<
      FileStorage,
      FileStorageData,
      ServiceParams,
      FileStoragePatch
    >
{
  constructor(public options: FileStorageServiceOptions) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find(_params?: ServiceParams): Promise<FileStorage[]> {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(id: Id, _params?: ServiceParams): Promise<FileStorage> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`,
    }
  }

  async create(
    data: FileStorageData,
    params?: ServiceParams,
  ): Promise<FileStorage>
  async create(
    data: FileStorageData[],
    params?: ServiceParams,
  ): Promise<FileStorage[]>
  async create(
    data: FileStorageData | FileStorageData[],
    params?: ServiceParams,
  ): Promise<FileStorage | FileStorage[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)))
    }

    return {
      id: 0,
      ...data,
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(
    id: NullableId,
    data: FileStorageData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params?: ServiceParams,
  ): Promise<FileStorage> {
    return {
      id: 0,
      ...data,
    }
  }

  async patch(
    id: NullableId,
    data: FileStoragePatch,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params?: ServiceParams,
  ): Promise<FileStorage> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(id: NullableId, _params?: ServiceParams): Promise<FileStorage> {
    return {
      id: 0,
      text: 'removed',
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
