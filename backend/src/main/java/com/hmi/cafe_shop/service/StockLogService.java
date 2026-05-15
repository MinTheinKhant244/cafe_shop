package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.StockLog;
import java.util.List;

public interface StockLogService {
    StockLog logStockChange(StockLog log);
    List<StockLog> getLogsByProduct(Long productId);
    List<StockLog> getAllLogs();
    void writeOffExpiredStock(Long stockLogId, String remarks);
//    List<StockLog> getExpiringProducts(int daysNotice);
}