package com.hmi.cafe_shop.entity;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Dashboard {

    private double totalRevenue;
    private long totalOrders;
    private long activeTables;
    private long pendingOrders;
}
