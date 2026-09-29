import {
    Award, Braces, Code, Columns3, FileCode, Heading, Image as ImageIcon, ImagePlus, LayoutGrid, LayoutTemplate,
    ListChecks, Megaphone, MessageCircle, Minus, MousePointerClick, MoveVertical, Package, Phone, CircleHelp, Quote,
    Rows3, ShoppingCart, Share2, Square, Star, Tag, TextCursorInput, Timer, Type, Users, Video, Layers, Box,
} from "lucide-react";

const MAP = {
    section: LayoutTemplate, container: Square, columns: Columns3, column: Rows3,
    heading: Heading, text: Type, image: ImageIcon, button: MousePointerClick, icon: Star, divider: Minus,
    spacer: MoveVertical, video: Video, icon_box: Package, image_box: ImagePlus, feature_list: ListChecks,
    testimonial: Quote, team: Users, pricing: Tag, faq: CircleHelp, countdown: Timer, logo: Award, gallery: LayoutGrid,
    form: TextCursorInput, order_form: ShoppingCart, whatsapp: MessageCircle, call: Phone, social_links: Share2, cta: Megaphone,
    html: Code, shortcode: Braces, custom_code: FileCode,
};

export function ElementIcon({ type, size = 16, className = "" }) {
    const Cmp = MAP[type] || Box;
    return <Cmp size={size} className={className} />;
}

export { Layers };
