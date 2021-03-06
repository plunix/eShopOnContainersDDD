﻿using System;
using System.Collections.Generic;
using System.Text;
using Infrastructure.Commands;

namespace eShop.Ordering.Order.Commands
{
    public class ChangeAddress : StampedCommand
    {
        public Guid OrderId { get; set; }

        public Guid ShippingId { get; set; }
        public Guid BillingId { get; set; }
    }
}
