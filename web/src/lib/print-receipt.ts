interface ReceiptItem {
  product_name: string
  quantity: number
  price: number
  addons?: { addon_name: string; addon_price: number; group_name?: string }[]
  notes?: string | null
}

interface ReceiptOrder {
  id: string
  total: string
  created_at: string
  user_name?: string | null
  user_phone?: string | null
  user_address?: string | null
  items: ReceiptItem[]
}

interface StoreInfo {
  name?: string
  phone?: string | null
  address?: string | null
}

export function printReceipt(order: ReceiptOrder, store: StoreInfo) {
  const date = new Date(order.created_at).toLocaleString("pt-BR")
  const shortId = order.id.slice(0, 8).toUpperCase()

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="text-align:left">${item.quantity}x ${item.product_name}</td>
      <td style="text-align:right">R$ ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
    ${(item.addons || [])
      .map(
        (a) => `
    <tr>
      <td style="text-align:left; padding-left:12px; font-size:11px; color:#555">${a.addon_name}${a.addon_price > 0 ? ` (+R$ ${a.addon_price.toFixed(2)})` : ""}</td>
      <td style="text-align:right; font-size:11px">${a.addon_price > 0 ? `R$ ${(a.addon_price * item.quantity).toFixed(2)}` : ""}</td>
    </tr>`
      )
      .join("")}
    ${item.notes ? `<tr><td colspan="2" style="font-size:11px; color:#555; padding-left:12px">Obs: ${item.notes}</td></tr>` : ""}
  `
    )
    .join("")

  const win = window.open("", "_blank", "width=400,height=600")
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Cupom ${shortId}</title>
<style>
  @page { margin: 0; size: 58mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 12px;
    width: 58mm;
    padding: 4mm 3mm;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .divider-solid { border-top: 1px solid #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; }
  .total { font-size: 14px; font-weight: bold; }
  .footer { font-size: 10px; text-align: center; margin-top: 6px; }
  @media print {
    body { width: auto; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="center bold" style="font-size:14px; margin-bottom:2px">${store.name || "Cardápio"}</div>
  ${store.address ? `<div class="center" style="font-size:10px">${store.address}</div>` : ""}
  ${store.phone ? `<div class="center" style="font-size:10px">Tel: ${store.phone}</div>` : ""}
  <div class="center" style="font-size:10px; margin-bottom:4px">${date}</div>
  <div class="divider"></div>
  <div class="center bold" style="font-size:11px; letter-spacing:1px">CUPOM ${shortId}</div>
  <div class="divider"></div>
  <table>
    ${itemsHtml}
  </table>
  <div class="divider-solid"></div>
  <table>
    <tr class="total">
      <td style="text-align:left">TOTAL</td>
      <td style="text-align:right">R$ ${Number(order.total).toFixed(2)}</td>
    </tr>
  </table>
  <div class="divider"></div>
  <div style="font-size:11px">Cliente: ${order.user_name || "—"}</div>
  <div style="font-size:11px">Tel: ${order.user_phone || "—"}</div>
  ${order.user_address ? `<div style="font-size:11px">Entrega: ${order.user_address}</div>` : ""}
  <div class="footer">Obrigado pela preferência!</div>
  <div class="center no-print" style="margin-top:8px">
    <button onclick="window.print()" style="padding:8px 24px; font-size:14px; cursor:pointer">Imprimir</button>
    <button onclick="window.close()" style="padding:8px 24px; font-size:14px; cursor:pointer; margin-left:8px">Fechar</button>
  </div>
  <script>setTimeout(() => window.print(), 300)</script>
</body>
</html>`)
  win.document.close()
}
