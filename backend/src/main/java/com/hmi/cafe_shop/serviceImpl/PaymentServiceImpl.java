package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Payment;
import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.repository.PaymentRepository;
import com.hmi.cafe_shop.repository.OrderRepository;
import com.hmi.cafe_shop.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional // Database Transaction Safe ဖြစ်စေရန်
    public Payment processPayment(Payment payment) {
        // ၁။ Order ID ရှိမရှိ စစ်ဆေး
        if (payment.getOrder() != null && payment.getOrder().getId() != null) {
            Order order = orderRepository.findById(payment.getOrder().getId())
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // ၂။ Order ရဲ့ Payment Status ကို PAID သို့ ပြောင်းလဲခြင်း
            order.setPaymentStatus("PAID");
            order.setPaymentMethod(payment.getMethod());
            orderRepository.save(order);

            payment.setOrder(order);
        }

        // ၃။ Cash ဖြင့် ပေးချေပါက ပြန်အမ်းငွေ တွက်ချက်ခြင်း
        if ("CASH".equalsIgnoreCase(payment.getMethod()) && payment.getCashReceived() != null) {
            double change = payment.getCashReceived() - payment.getAmount();
            payment.setChangeAmount(change < 0 ? 0.0 : change);
        }

        return paymentRepository.save(payment);
    }

    @Override
    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    @Override
    public Optional<Payment> getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    @Override
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}