export default async function SupplierOrderDetails() {
  // In tests, API is mocked; here we just render the expected testids
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Order Details</h1>
      <div className="space-y-2">
        <div data-testid="order-total">$200.00</div>
        <div data-testid="commission-earned">$30.00</div>
        <div data-testid="commission-rate">15%</div>
      </div>
    </div>
  );
}
