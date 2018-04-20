﻿using System;
using System.Collections.Generic;
using System.Text;
using Infrastructure.Commands;
using Infrastructure.ServiceStack;
using ServiceStack;

namespace eShop.Ordering.Order.Services
{
    [Api("Ordering")]
    [Route("/order/{OrderId}/address", "POST")]
    public class SetAddressOrder : DomainCommand
    {
        public Guid OrderId { get; set; }
        public Guid AddressId { get; set; }
    }
}