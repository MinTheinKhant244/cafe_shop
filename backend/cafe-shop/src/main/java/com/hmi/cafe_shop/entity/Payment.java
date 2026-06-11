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

    private Double amount;

    private Double cashReceived;

    private Double changeAmount;

    private String method; // CASH, KPAY, CARD

    private String transactionNo;

    private String status; // SUCCESS, FAILED, REFUNDED

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private LocalDateTime paymentDate;

    @PrePersist
    public void prePersist() {
        this.paymentDate = LocalDateTime.now();
        if (status == null) status = "SUCCESS";
    }
}