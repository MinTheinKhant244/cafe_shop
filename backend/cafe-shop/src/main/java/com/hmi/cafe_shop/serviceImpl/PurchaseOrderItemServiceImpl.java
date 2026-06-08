package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.PurchaseOrderItem;
import com.hmi.cafe_shop.repository.PurchaseOrderItemRepository;
import com.hmi.cafe_shop.service.PurchaseOrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseOrderItemServiceImpl implements PurchaseOrderItemService {

    private final PurchaseOrderItemRepository poItemRepository;

    @Override
    public PurchaseOrderItem addPOItem(PurchaseOrderItem item) {
        // Subtotal: Auto calculate
    	if (item.getQuantityOrdered() != null && item.getUnitPrice() != null) {
            item.setSubtotal(item.getQuantityOrdered() * item.getUnitPrice());
        }
        return poItemRepository.save(item);
    }

    @Override
    public List<PurchaseOrderItem> getItemsByPOId(Long poId) {
        return poItemRepository.findByPurchaseOrderId(poId);
    }

    @Override
    public PurchaseOrderItem updateReceivedQuantity(Long id, Integer qtyReceived) {
        return poItemRepository.findById(id).map(item -> {
            item.setQuantityReceived(qtyReceived);
            return poItemRepository.save(item);
        }).orElseThrow(() -> new RuntimeException("PO Item not found"));
    }

    @Override
    public void deletePOItem(Long id) {
        poItemRepository.deleteById(id);
    }
}