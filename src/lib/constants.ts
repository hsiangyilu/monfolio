import {
  Home,
  TrendingUp,
  Globe,
  Bitcoin,
  Wallet,
  CreditCard,
  Settings,
  BarChart2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  slug: string;
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

export interface Category {
  slug: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const categories: Category[] = [
  { slug: "tw-stocks", label: "台股", icon: TrendingUp, color: "#00d4ff" },
  { slug: "us-stocks", label: "美股", icon: Globe, color: "#7c3aed" },
  { slug: "crypto", label: "虛擬貨幣", icon: Bitcoin, color: "#f59e0b" },
  { slug: "cash", label: "現金", icon: Wallet, color: "#22c55e" },
  { slug: "debt", label: "負債", icon: CreditCard, color: "#ef4444" },
];

export const navItems: NavItem[] = [
  { slug: "overview", label: "Overview", href: "/", icon: Home, color: "#00d4ff" },
  { slug: "tw-stocks", label: "台股", href: "/tw-stocks", icon: TrendingUp, color: "#00d4ff" },
  { slug: "us-stocks", label: "美股", href: "/us-stocks", icon: Globe, color: "#7c3aed" },
  { slug: "crypto", label: "虛擬貨幣", href: "/crypto", icon: Bitcoin, color: "#f59e0b" },
  { slug: "cash", label: "現金", href: "/cash", icon: Wallet, color: "#22c55e" },
  { slug: "debt", label: "負債", href: "/debt", icon: CreditCard, color: "#ef4444" },
  { slug: "insights", label: "Insights", href: "/insights", icon: BarChart2, color: "#a78bfa" },
  { slug: "settings", label: "Settings", href: "/settings", icon: Settings, color: "#94a3b8" },
];

export const mobileNavItems: NavItem[] = [
  { slug: "overview", label: "Overview", href: "/", icon: Home, color: "#00d4ff" },
  { slug: "tw-stocks", label: "台股", href: "/tw-stocks", icon: TrendingUp, color: "#00d4ff" },
  { slug: "us-stocks", label: "美股", href: "/us-stocks", icon: Globe, color: "#7c3aed" },
  { slug: "crypto", label: "虛擬貨幣", href: "/crypto", icon: Bitcoin, color: "#f59e0b" },
  { slug: "debt", label: "負債", href: "/debt", icon: CreditCard, color: "#ef4444" },
];

export const financialQuotes: { text: string; textZh: string; author: string }[] = [
  { text: "Rule No.1: Never lose money. Rule No.2: Never forget rule No.1.", textZh: "投資最重要的事是不要虧損，第二重要的事是不要忘記第一條。", author: "Warren Buffett" },
  { text: "Be fearful when others are greedy, and greedy when others are fearful.", textZh: "別人恐懼時我貪婪，別人貪婪時我恐懼。", author: "Warren Buffett" },
  { text: "Price is what you pay. Value is what you get.", textZh: "價格是你付出的，價值是你得到的。", author: "Warren Buffett" },
  { text: "If you aren't willing to own a stock for 10 years, don't even think about owning it for 10 minutes.", textZh: "如果你不願意持有一檔股票十年，那就連十分鐘也不要持有。", author: "Warren Buffett" },
  { text: "Time is the friend of the wonderful company, the enemy of the mediocre.", textZh: "時間是好公司的朋友，壞公司的敵人。", author: "Warren Buffett" },
  { text: "Risk comes from not knowing what you're doing.", textZh: "風險來自於你不知道自己在做什麼。", author: "Warren Buffett" },
  { text: "Never invest in a business you cannot understand.", textZh: "永遠不要投資你不了解的東西。", author: "Warren Buffett" },
  { text: "Compound interest is the eighth wonder of the world.", textZh: "複利是世界第八大奇蹟。", author: "Albert Einstein" },
  { text: "In the short run, the market is a voting machine but in the long run, it is a weighing machine.", textZh: "市場短期是投票機，長期是秤重機。", author: "Benjamin Graham" },
  { text: "The essence of investment management is the management of risks, not the management of returns.", textZh: "投資管理的本質是風險管理，而非報酬管理。", author: "Benjamin Graham" },
  { text: "The margin of safety is the central concept of investment.", textZh: "安全邊際是投資中最重要的概念。", author: "Benjamin Graham" },
  { text: "Knowing what you don't know is more useful than being brilliant.", textZh: "知道自己不知道什麼，比聰明更有用。", author: "Charlie Munger" },
  { text: "You must force yourself to consider opposing arguments.", textZh: "你必須迫使自己考慮相反的論點。", author: "Charlie Munger" },
  { text: "If the reason you bought it disappears, sell it.", textZh: "如果你買入的理由消失了，那就賣出。", author: "Charlie Munger" },
  { text: "The markets can remain irrational longer than you can remain solvent.", textZh: "市場可以維持非理性的時間比你能維持償付能力的時間更長。", author: "John Maynard Keynes" },
  { text: "The secret to making money in stocks is not to get scared out of them.", textZh: "賺錢的秘訣在於不被嚇出場。", author: "Peter Lynch" },
  { text: "Invest in what you know.", textZh: "投資你所了解的東西。", author: "Peter Lynch" },
  { text: "Everyone has the brainpower to make money in stocks. Not everyone has the stomach.", textZh: "每個人都有足夠的智力在股市賺錢，但不是每個人都有足夠的耐心。", author: "Peter Lynch" },
  { text: "Diversification is protection against ignorance.", textZh: "分散投資是對無知的保護。", author: "Warren Buffett" },
  { text: "The stock market is a device for transferring money from the impatient to the patient.", textZh: "股市是從急躁的人手中把錢轉移到有耐心的人手中的工具。", author: "Warren Buffett" },
  { text: "You don't need a high IQ to invest. What you need is discipline.", textZh: "投資不需要超人的智商，而需要超人的紀律。", author: "Warren Buffett" },
  { text: "Predicting rain doesn't count. Building arks does.", textZh: "預測雨不算什麼，建造方舟才算。", author: "Warren Buffett" },
  { text: "History doesn't repeat itself, but it often rhymes.", textZh: "歷史不會重演，但總是驚人地相似。", author: "Mark Twain" },
  { text: "It's not how much money you make, but how much money you keep.", textZh: "致富的關鍵不在於你賺多少，而在於你留下多少。", author: "Robert Kiyosaki" },
  { text: "Wealth is measured by how long you can survive without working.", textZh: "真正的財富是你停止工作後還能活多久。", author: "Robert Kiyosaki" },
  { text: "The most important quality for an investor is temperament, not intellect.", textZh: "投資者最重要的素質是性格，而非智力。", author: "Warren Buffett" },
  { text: "In investing, what is comfortable is rarely profitable.", textZh: "在投資中，舒服的東西很少能帶來利潤。", author: "Robert Arnott" },
  { text: "The individual investor should act consistently as an investor and not as a speculator.", textZh: "個人投資者應始終以投資者而非投機者的身分行事。", author: "Benjamin Graham" },
];
