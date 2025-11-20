import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import DiscountIcon from '@mui/icons-material/Discount';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import type { TipoRecompensa } from './types';

export const tipoIcons: Record<Exclude<TipoRecompensa, 'todos'>, React.ReactElement> = {
  produto: <ShoppingBasketIcon fontSize="small" />,
  desconto: <DiscountIcon fontSize="small" />,
  voucher: <CardGiftcardIcon fontSize="small" />,
  cupom: <LocalOfferIcon fontSize="small" />,
};
