import { types, getRoot, getEnv, flow } from 'mobx-state-tree';
import { JsonServiceClient } from '@servicestack/client';
import { parse } from 'qs';
import * as validate from 'validate.js';
import Debug from 'debug';

import rules from '../validation';
import { FieldDefinition } from '../../../components/models';

import { DTOs } from '../../../utils/eShop.dtos';
import { ApiClientType, StoreType } from '../../../stores';

const debug = new Debug('login');

export interface LoginType {
  email: string;
  password: string;

  readonly validation: any;
  readonly form: { [idx: string]: FieldDefinition };
  submit(): Promise<{}>;
}
export const LoginStore = types
  .model({
    email: types.optional(types.string, ''),
    password: types.optional(types.string, '')
  })
  .views(self => ({
    get validation() {
      const validation = {
        email: rules.email,
        password: rules.password
      };
      return validate(self, validation);
    }
  }))
  .views(self => ({
    get form(): {[idx: string]: FieldDefinition} {
      return ({
        email: {
          input: 'text',
          label: 'Email',
          autoComplete: 'email',
          required: true,
        },
        password: {
          input: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'current-password',
          required: true,
        }
      });
    }
  }))
  .actions(self => {
    const submit = flow(function*() {
      debug('attempting login: %s', self.email);
      const rootStore = getEnv(self).store as StoreType;

      try {
        const client = getEnv(self).client as JsonServiceClient;

        const request = new DTOs.Authenticate();
        request.provider = 'credentials';
        request.userName = self.email;
        request.password = self.password;
        request.rememberMe = true;

        const response: DTOs.AuthenticateResponse = yield client.post(request);

        rootStore.auth.updateToken(response.bearerToken);

        debug('login successful: %s', response.bearerToken);
        const nextPath = parse(window.location.search.slice(1)).nextPath || '/';
        rootStore.history.push(nextPath);

      } catch (error) {
        debug('login unsuccessful', error);
        rootStore.alertStack.add('error', 'Failed to login');
        rootStore.auth.reset();
      }
    });

    return { submit };
  });
