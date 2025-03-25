# Archaka Priest Booking Platform

## Payment Flow Documentation

### Overview
This document outlines the payment processing system used in the Archaka Priest Booking Platform, including pricing calculations, commission structures, and the flow of funds between customers, priests, and the platform.

### Pricing Formula
The platform uses a specific formula to calculate the final customer price:

```
M = [Base Price × (p + 0.02)] / 0.98
```

Where:
- **M** is the final price customers pay
- **Base Price** is the amount set by the priest
- **p** is the platform commission percentage (10% or 0.1)
- **0.02** represents the payment gateway fee (2%)

This formula ensures that after the payment gateway deducts its fee (2%), the platform receives the full intended commission (10% of the base price), and the priest receives 100% of their set base price.

### Price Components Breakdown

1. **Priest's Base Price**: The amount set by the priest for their service. This is the amount they will receive in full.

2. **Platform Commission**: 10% of the base price. This is the revenue for the platform.

3. **Payment Gateway Fee**: 2% of the total transaction amount paid by the customer.

4. **Total Customer Price**: The sum calculated using the formula, which is what the customer pays.

### Example Calculation

If a priest sets their base price at ₹1,000:

1. Base Price: ₹1,000
2. Platform Commission (10%): ₹100
3. Formula Calculation: [₹1,000 × (0.1 + 0.02)] / 0.98 = ₹1,224.49
4. Payment Gateway Fee (2% of ₹1,224.49): ₹24.49
5. Customer Pays: ₹1,224 (rounded)
6. After payment gateway deduction: ₹1,200
7. Platform receives: ₹100
8. Priest receives: ₹1,000

### Payment Flow

1. **Price Setting**:
   - Priests set their base price for each service in their profile
   - The platform calculates the final customer price using the formula
   - Customers see transparent pricing with breakdown of fees

2. **Booking and Payment**:
   - Customer books a service and pays the calculated total amount
   - Payment is processed through the payment gateway (which deducts 2%)
   - The booking is marked as "pending" until the priest accepts

3. **Service Fulfillment**:
   - Priest accepts and completes the service
   - The order status changes to "completed"
   - The earnings are added to the priest's available balance

4. **Withdrawals**:
   - Priests can request withdrawals of their available balance
   - Multiple payment methods are supported (Bank transfer, UPI)
   - Withdrawals are processed within 2-3 business days

### Priest Dashboard

The priest portal provides comprehensive financial management tools:

1. **Earnings Overview**:
   - Available Balance (ready for withdrawal)
   - Pending Balance (from recently completed services)
   - Total Earnings (all-time earnings)
   - Withdrawn Amount (total withdrawn to date)

2. **Price Setting Tools**:
   - Service pricing management with real-time calculations
   - Price calculator to estimate customer price and earnings
   - Individual price customization for each service

3. **Transactions History**:
   - Detailed record of all earnings and withdrawals
   - Transaction filters and search functionality
   - Detailed breakdown of pricing for each booking

4. **Payment Methods Management**:
   - Multiple payment methods can be saved
   - Verification process for new payment methods
   - Option to set default payment method

### Customer View

Customers see transparent pricing throughout the booking process:

1. **Service Selection**:
   - Base price and final price clearly displayed
   - Service details and pricing information

2. **Priest Selection**:
   - Pricing comparison between different priests
   - Complete price breakdown before booking

3. **Checkout**:
   - Itemized receipt with all fee components
   - Secure payment processing
   - Order confirmation with payment details

### Backend Processing

The payment system includes these backend processes:

1. **Commission Calculation**:
   - Automated calculation using the pricing formula
   - Real-time updates to priest earnings

2. **Payment Verification**:
   - Verification of successful payments
   - Handling of failed payments and refunds

3. **Earnings Distribution**:
   - System for tracking priest earnings
   - Automated addition to available balance
   - Periodic settlement of pending balances "# archaka_online" 
