import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import DiscountIcon from '@mui/icons-material/Discount';

export const tipoIcons: Record<string, React.ReactElement> = {
  produto: <ShoppingBasketIcon fontSize="small" />,
  desconto: <DiscountIcon fontSize="small" />,
  voucher: <CardGiftcardIcon fontSize="small" />,
  cupom: <LocalOfferIcon fontSize="small" />,
};
