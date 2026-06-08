package com.hmi.cafe_shop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Double amount;
    @Column(name = "cash_received")
    private Double cashReceived; // Cash

    @Column(name = "change_amount")
    private Double changeAmount; // ပြန်အမ်းငွေ

    @Column(nullable = false)
    private String method; // CASH, KPAY, WAVE, CARD, etc.

    @Column(name = "transaction_no")
    private String transactionNo; 

    private String status = "SUCCESS"; // SUCCESS, FAILED, REFUNDED

    @Column(name = "payment_date", updatable = false)
    private LocalDateTime paymentDate;

    @PrePersist
    protected void onCreate() {
        this.paymentDate = LocalDateTime.now();
    }
}