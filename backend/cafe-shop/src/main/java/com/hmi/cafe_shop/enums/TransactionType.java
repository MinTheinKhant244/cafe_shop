package com.hmi.cafe_shop.enums;

public enum TransactionType {
    STOCK_IN("Stock In"),
    STOCK_OUT("Stock Out"),
    ADJUSTMENT("Adjustment"),
    INITIAL("Initial Stock"),
    RETURN("Return"),
    WASTAGE("Wastage");

    private final String displayName;

    TransactionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}