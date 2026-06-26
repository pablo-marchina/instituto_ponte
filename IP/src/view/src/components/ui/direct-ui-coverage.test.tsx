import React from "react";
import { describe, expect, it } from "vitest";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuViewport,
} from "./navigation-menu";
import {
  Popover,
  PopoverAnchor,
  PopoverTrigger,
} from "./popover";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const call = (component: unknown, props: Record<string, unknown> = {}) =>
  (component as (props: Record<string, unknown>) => React.ReactNode)(props);

describe("direct ui wrapper coverage", () => {
  it("executa wrappers de breadcrumb com variantes opcionais", () => {
    const nodes = [
      call(Breadcrumb, { children: "nav" }),
      call(BreadcrumbList, { children: "list", className: "x" }),
      call(BreadcrumbItem, { children: "item", className: "x" }),
      call(BreadcrumbLink, { children: "link", href: "/" }),
      call(BreadcrumbLink, { asChild: true, children: <a href="/">slot</a> }),
      call(BreadcrumbPage, { children: "page" }),
      call(BreadcrumbSeparator, {}),
      call(BreadcrumbSeparator, { children: "/" }),
      call(BreadcrumbEllipsis, {}),
    ];

    expect(nodes.every(React.isValidElement)).toBe(true);
  });

  it("executa wrappers de context menu, incluindo portal e submenus", () => {
    const nodes = [
      call(ContextMenu, { children: "root" }),
      call(ContextMenuTrigger, { children: "trigger" }),
      call(ContextMenuGroup, { children: "group" }),
      call(ContextMenuPortal, { children: "portal" }),
      call(ContextMenuSub, { children: "sub" }),
      call(ContextMenuRadioGroup, { children: "radio" }),
      call(ContextMenuSubTrigger, { children: "subtrigger", inset: true, className: "x" }),
      call(ContextMenuSubContent, { children: "subcontent", className: "x" }),
      call(ContextMenuContent, { children: "content", className: "x" }),
      call(ContextMenuItem, { children: "item", inset: true, variant: "destructive", className: "x" }),
      call(ContextMenuCheckboxItem, { children: "check", checked: true, className: "x" }),
      call(ContextMenuRadioItem, { children: "radioitem", value: "a", className: "x" }),
      call(ContextMenuLabel, { children: "label", inset: true, className: "x" }),
      call(ContextMenuSeparator, { className: "x" }),
      call(ContextMenuShortcut, { children: "Ctrl+K", className: "x" }),
    ];

    expect(nodes.every(React.isValidElement)).toBe(true);
  });

  it("executa wrappers de menubar, incluindo portal e submenus", () => {
    const nodes = [
      call(Menubar, { children: "root", className: "x" }),
      call(MenubarPortal, { children: "portal" }),
      call(MenubarMenu, { children: "menu" }),
      call(MenubarTrigger, { children: "trigger", className: "x" }),
      call(MenubarContent, { children: "content", className: "x" }),
      call(MenubarGroup, { children: "group" }),
      call(MenubarSeparator, { className: "x" }),
      call(MenubarLabel, { children: "label", inset: true, className: "x" }),
      call(MenubarItem, { children: "item", inset: true, variant: "destructive", className: "x" }),
      call(MenubarShortcut, { children: "Ctrl+M", className: "x" }),
      call(MenubarCheckboxItem, { children: "check", checked: true, className: "x" }),
      call(MenubarRadioGroup, { children: "radio" }),
      call(MenubarRadioItem, { children: "radioitem", value: "a", className: "x" }),
      call(MenubarSub, { children: "sub" }),
      call(MenubarSubTrigger, { children: "subtrigger", inset: true, className: "x" }),
      call(MenubarSubContent, { children: "subcontent", className: "x" }),
    ];

    expect(nodes.every(React.isValidElement)).toBe(true);
  });

  it("executa wrappers simples de dialogs, drawer, popover, sheet e navegacao", () => {
    const nodes = [
      call(AlertDialog, { children: "alert" }),
      call(AlertDialogTrigger, { children: "trigger" }),
      call(AlertDialogPortal, { children: "portal" }),
      call(AlertDialogHeader, { children: "header", className: "x" }),
      call(AlertDialogFooter, { children: "footer", className: "x" }),
      call(AlertDialogTitle, { children: "title", className: "x" }),
      call(AlertDialogDescription, { children: "description", className: "x" }),
      call(Dialog, { children: "dialog" }),
      call(DialogTrigger, { children: "trigger" }),
      call(DialogPortal, { children: "portal" }),
      call(DialogClose, { children: "close" }),
      call(DialogHeader, { children: "header", className: "x" }),
      call(DialogFooter, { children: "footer", className: "x" }),
      call(DialogTitle, { children: "title", className: "x" }),
      call(DialogDescription, { children: "description", className: "x" }),
      call(Drawer, { children: "drawer" }),
      call(DrawerTrigger, { children: "trigger" }),
      call(DrawerPortal, { children: "portal" }),
      call(DrawerClose, { children: "close" }),
      call(DrawerHeader, { children: "header", className: "x" }),
      call(DrawerFooter, { children: "footer", className: "x" }),
      call(DrawerTitle, { children: "title", className: "x" }),
      call(DrawerDescription, { children: "description", className: "x" }),
      call(DropdownMenu, { children: "dropdown" }),
      call(DropdownMenuPortal, { children: "portal" }),
      call(DropdownMenuTrigger, { children: "trigger" }),
      call(DropdownMenuGroup, { children: "group" }),
      call(DropdownMenuRadioGroup, { children: "radio" }),
      call(DropdownMenuLabel, { children: "label", inset: true, className: "x" }),
      call(DropdownMenuSeparator, { className: "x" }),
      call(DropdownMenuShortcut, { children: "Ctrl+D", className: "x" }),
      call(DropdownMenuSub, { children: "sub" }),
      call(Popover, { children: "popover" }),
      call(PopoverTrigger, { children: "trigger" }),
      call(PopoverAnchor, { children: "anchor" }),
      call(Sheet, { children: "sheet" }),
      call(SheetTrigger, { children: "trigger" }),
      call(SheetClose, { children: "close" }),
      call(SheetHeader, { children: "header", className: "x" }),
      call(SheetFooter, { children: "footer", className: "x" }),
      call(SheetTitle, { children: "title", className: "x" }),
      call(SheetDescription, { children: "description", className: "x" }),
      call(NavigationMenu, { children: "nav", className: "x", viewport: false }),
      call(NavigationMenuList, { children: "list", className: "x" }),
      call(NavigationMenuItem, { children: "item", className: "x" }),
      call(NavigationMenuLink, { children: "link", className: "x", active: true }),
      call(NavigationMenuViewport, { className: "x" }),
    ];

    expect(nodes.every(React.isValidElement)).toBe(true);
  });
});
