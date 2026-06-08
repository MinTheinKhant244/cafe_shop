package com.hmi.cafe_shop.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class InvoiceGenerator {
    public static String generateInvoiceNo() {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        return "INV-" + dtf.format(LocalDateTime.now());
    }
}