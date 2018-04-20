﻿using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Infrastructure.Extensions;
using NServiceBus;
using ServiceStack;

namespace eShop.Catalog.Product
{
    public class Service : ServiceStack.Service
    {
        private readonly IMessageSession _bus;

        public Service(IMessageSession bus)
        {
            _bus = bus;
        }

        public Task<object> Any(Services.GetProduct request)
        {
            return _bus.RequestQuery<Queries.Product, Models.Product>(new Queries.Product
            {
                ProductId = request.ProductId
            });
        }
        public Task<object> Any(Services.ListProducts request)
        {
            return _bus.RequestPaged<Queries.List, Models.Product>(new Queries.List
            {
            });
        }

        public Task Any(Services.AddProduct request)
        {
            return _bus.CommandToDomain(new Commands.Add
            {
                ProductId = request.ProductId,
                CategoryBrandId = request.CategoryBrandId,
                CategoryTypeId = request.CategoryTypeId,
                Name = request.Name,
                Price = request.Price,
            });
        }

        public Task Any(Services.RemoveProduct request)
        {
            return _bus.CommandToDomain(new Commands.Remove
            {
                ProductId = request.ProductId
            });
        }

        public async Task Any(Services.SetPictureProduct request)
        {
            var image = await GetImageFromUrl(request.PictureUrl).ConfigureAwait(false);
            await _bus.CommandToDomain(new Commands.SetPicture
            {
                ProductId = request.ProductId,
                Content = image.Data,
                ContentType = image.Type
            }).ConfigureAwait(false);
        }

        public Task Any(Services.UpdateDescriptionProduct request)
        {
            return _bus.CommandToDomain(new Commands.UpdateDescription
            {
                ProductId = request.ProductId,
                Description = request.Description
            });
        }

        public Task Any(Services.UpdatePriceProduct request)
        {
            return _bus.CommandToDomain(new Commands.UpdatePrice
            {
                ProductId = request.ProductId,
                Price = request.Price
            });
        }



        private class Image
        {
            public string Type { get; set; }

            public byte[] Data { get; set; }
        }

        private async Task<Image> GetImageFromUrl(string url)
        {
            try
            {
                var request = WebRequest.Create(url);
                var response = await request.GetResponseAsync().ConfigureAwait(false);

                var contentType = response.ContentType;
                var buffer = response.GetResponseStream().ReadFully();
                response.Close();

                return new Image { Type = contentType, Data = buffer };
            }
            catch
            {
                return null;
            }
        }
    }
}