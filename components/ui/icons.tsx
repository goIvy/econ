/**
 * The app's one icon family: Phosphor, regular weight everywhere (a single
 * stroke standard). Names match what the components already use, so the
 * swap from lucide-react is a one-line import change per file.
 */
import {
  ArrowCounterClockwise,
  ArrowDown as PArrowDown,
  ArrowLeft as PArrowLeft,
  ArrowRight as PArrowRight,
  ArrowSquareOut,
  ArrowUp as PArrowUp,
  ArrowUpRight as PArrowUpRight,
  BookOpenText,
  BookmarkSimple,
  CaretDown,
  CaretUp,
  CaretUpDown,
  Check as PCheck,
  CircleNotch,
  Info as PInfo,
  LinkSimple,
  List,
  ListBullets,
  MagnifyingGlass,
  MagnifyingGlassMinus,
  Pause as PPause,
  PencilSimple,
  Play as PPlay,
  Plus as PPlus,
  Sliders,
  Trash,
  Warning,
  WarningCircle,
  X as PX,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react";

function make(I: PhosphorIcon, weight: IconProps["weight"] = "regular") {
  function Glyph(props: IconProps) {
    return <I weight={weight} aria-hidden {...props} />;
  }
  Glyph.displayName = `Icon(${I.displayName ?? "phosphor"})`;
  return Glyph;
}

export const AlertCircle = make(WarningCircle);
export const AlertTriangle = make(Warning);
export const ArrowDown = make(PArrowDown);
export const ArrowLeft = make(PArrowLeft);
export const ArrowRight = make(PArrowRight);
export const ArrowUp = make(PArrowUp);
export const ArrowUpRight = make(PArrowUpRight);
export const BookOpen = make(BookOpenText);
export const Bookmark = make(BookmarkSimple);
export const BookmarkCheck = make(BookmarkSimple, "fill");
export const Check = make(PCheck);
export const ChevronDown = make(CaretDown);
export const ChevronUp = make(CaretUp);
export const ChevronsUpDown = make(CaretUpDown);
export const ExternalLink = make(ArrowSquareOut);
export const Info = make(PInfo);
export const Link2 = make(LinkSimple);
export const Loader2 = make(CircleNotch);
export const Menu = make(List);
export const Sections = make(ListBullets);
export const Pause = make(PPause, "fill");
export const Pencil = make(PencilSimple);
export const Play = make(PPlay, "fill");
export const Plus = make(PPlus);
export const RotateCcw = make(ArrowCounterClockwise);
export const Search = make(MagnifyingGlass);
export const SearchX = make(MagnifyingGlassMinus);
export const SlidersHorizontal = make(Sliders);
export const Trash2 = make(Trash);
export const X = make(PX);
