import { types, flow, getEnv, getParent, applySnapshot, getSnapshot, onSnapshot, addDisposer } from 'mobx-state-tree';
import { History } from 'history';
import * as validate from 'validate.js';
import uuid from 'uuid/v4';
import Debug from 'debug';

import rules from '../validation';
import { FieldDefinition } from '../../../components/models';

import { DTOs } from '../../../utils/eShop.dtos';
import { ApiClientType, AlertStackType, AuthenticationType } from '../../../stores';

import { BasketType, BasketModel } from '../models/basket';
import { ItemIndexType, ItemIndexModel } from '../models/items';

const debug = new Debug('checkout');

export interface CheckoutStoreType {
  loading: boolean;
  basket: BasketType;
  items: Map<string, ItemIndexType>;

  load: () => Promise<{}>;
  validateBasket: () => void;
}

export const CheckoutStoreModel = types
  .model('CheckoutStore',
    {
      loading: types.optional(types.boolean, false),

      basketId: types.maybe(types.string),
      basket: types.maybe(BasketModel),
      items: types.optional(types.map(ItemIndexModel), {}),

    })
  .actions(self => {
    const load = flow(function*() {
      debug('loading catalog details');

      const client = getEnv(self).api as ApiClientType;

      self.loading = true;
      try {
        const request = new DTOs.GetBasket();
        request.basketId = self.basketId;
        const basketResponse: DTOs.QueryResponse<DTOs.Basket> = yield client.query(request);

        if (!self.basket) {
          self.basket = BasketModel.create(basketResponse.payload);
        } else {
          applySnapshot(self.basket, basketResponse.payload);
        }

        const claimRequest = new DTOs.ClaimBasket();
        claimRequest.basketId = self.basketId;
        yield client.command(claimRequest);

        const auth = getEnv(self).auth as AuthenticationType;
        self.basket.customer = auth.name;
        self.basket.customerId = auth.username;

        const items = new DTOs.GetBasketItems();
        items.basketId = self.basket.id;
        const itemsResponse: DTOs.PagedResponse<DTOs.BasketItemIndex> = yield client.paged(items);

        self.items.clear();
        itemsResponse.records.forEach(item => {
          self.items.put(item);
        });

      } catch (error) {
        debug('received http error: ', error);
        throw error;
      }
      self.loading = false;
    });
    const validateBasket = () => {
      if (self.basketId && self.basket.customerId && self.basket.totalItems > 0 && self.items.size > 0) {
        return;
      }

      const alerts = getEnv(self).alertStack as AlertStackType;
      alerts.add('error', 'invalid basket state');

      const history = getEnv(self).history as History;
      history.push('/');
    };

    const afterCreate = () => {
      const basketStorage = localStorage.getItem('basket.eShop');
      applySnapshot(self, basketStorage ? JSON.parse(basketStorage) : {});

    };

    return { load, validateBasket, afterCreate };
  });