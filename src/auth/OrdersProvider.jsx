import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProducts } from "@/components/auth/ProductsProvider";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const OrdersContext = createContext(null);

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
};

const safeMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts === "number") return ts;
  const d = new Date(ts);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
};

const formatDate = (ts) => {
  if (!ts) return "N/A";
  const date = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const downloadCsv = (filename, rows) => {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          const needsWrap = /[",\n]/.test(s);
          const escaped = s.replace(/"/g, '""');
          return needsWrap ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const flattenOrderForCsv = (order) => {
  const orderId = order?.id || "";
  const createdAt = formatDate(order?.createdAt);
  const status = order?.status || "";
  const total = order?.total ?? "";
  const email = order?.email || "";
  const phone = order?.phone || "";
  const userId = order?.userId || "";
  const guestUserId = order?.guestUserId || "";
  const payRef = order?.payment?.reference || "";
  const payProvider = order?.payment?.provider || "";
  const payStatus = order?.payment?.status || "";

  const bill = order?.billingInfo || {};
  const billingFullName = bill?.fullName || "";
  const billingAddress = bill?.address || "";
  const billingCity = bill?.city || "";
  const billingState = bill?.state || "";
  const billingZip = bill?.zipCode || "";
  const billingCountry = bill?.country || "";

  const delivery = order?.deliveryInfo || {};
  const deliveryStatus = delivery?.status || "";
  const courier = delivery?.courier || "";
  const trackingNumber = delivery?.trackingNumber || "";
  const deliveryNotes = delivery?.notes || "";

  const cart = Array.isArray(order?.cart) ? order.cart : [];

  if (cart.length === 0) {
    return [
      [
        orderId,
        createdAt,
        status,
        total,
        email,
        phone,
        userId,
        guestUserId,
        payRef,
        payProvider,
        payStatus,
        billingFullName,
        billingAddress,
        billingCity,
        billingState,
        billingZip,
        billingCountry,
        deliveryStatus,
        courier,
        trackingNumber,
        deliveryNotes,
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    ];
  }

  return cart.map((item) => {
    const itemName = item?.name || "";
    const itemSku = item?.sku || "";
    const qty = item?.quantity ?? 1;
    const variantName = item?.selectedVariant?.name || "";
    const unitPrice = item?.selectedVariant?.price ?? item?.price ?? 0;

    const extras = Array.isArray(item?.selectedExtras) ? item.selectedExtras : [];
    const extrasSummary =
      extras.length === 0
        ? ""
        : extras
            .map((ex) => {
              const exQty = ex?.qty ?? ex?.quantity ?? 1;
              const exName = ex?.name || "";
              const exVar = ex?.selectedVariant?.name ? ` (${ex.selectedVariant.name})` : "";
              const exText = ex?.textValue ? ` [Text: ${ex.textValue}]` : "";
              return `${exName}${exVar} x${exQty}${exText}`;
            })
            .join(" | ");

    return [
      orderId,
      createdAt,
      status,
      total,
      email,
      phone,
      userId,
      guestUserId,
      payRef,
      payProvider,
      payStatus,
      billingFullName,
      billingAddress,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      deliveryStatus,
      courier,
      trackingNumber,
      deliveryNotes,
      itemName,
      itemSku,
      qty,
      unitPrice,
      variantName,
      extrasSummary,
    ];
  });
};

const normalize = (v) =>
  String(v || "")
    .toLowerCase()
    .trim();

const orderMatchesQuery = (order, q) => {
  if (!q) return true;
  const needle = normalize(q);
  if (!needle) return true;

  const id = normalize(order?.id);
  const email = normalize(order?.email);
  const phone = normalize(order?.phone);
  const status = normalize(order?.status);
  const payRef = normalize(order?.payment?.reference);
  const bill = order?.billingInfo || {};
  const billName = normalize(bill?.fullName);
  const billAddr = normalize(bill?.address);
  const billCity = normalize(bill?.city);
  const billState = normalize(bill?.state);

  const cart = Array.isArray(order?.cart) ? order.cart : [];
  const itemsText = normalize(
    cart
      .map((i) => [i?.name, i?.sku, i?.selectedVariant?.name].filter(Boolean).join(" "))
      .join(" | "),
  );

  const haystack = [
    id,
    email,
    phone,
    status,
    payRef,
    billName,
    billAddr,
    billCity,
    billState,
    itemsText,
  ].join(" ");

  return haystack.includes(needle);
};

const withinRange = (createdAt, rangeKey) => {
  if (!rangeKey || rangeKey === "all") return true;

  const ms = safeMillis(createdAt);
  if (!ms) return false;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const ranges = {
    "7d": now - 7 * day,
    "30d": now - 30 * day,
    "90d": now - 90 * day,
    "365d": now - 365 * day,
  };

  const from = ranges[rangeKey];
  if (!from) return true;
  return ms >= from;
};

const buildStats = (list) => {
  const base = {
    all: list.length,
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  list.forEach((o) => {
    const s = String(o?.status || "pending").toLowerCase();
    if (base[s] != null) base[s] += 1;
  });

  return base;
};

export function OrdersProvider({ children }) {
  const auth = useAuth();
  const { user } = auth;
  const isAdmin = Boolean(auth?.isAdmin || user?.isAdmin);

  const { guestUserId } = useProducts();

  const [tab, setTab] = useState(isAdmin ? "all" : "mine"); // "all" | "mine"
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Space-conscious filter state
  const [filters, setFilters] = useState({
    q: "",
    status: "all", // all | pending | paid | ...
    dateRange: "all", // all | 7d | 30d | 90d | 365d
    sort: "newest", // newest | oldest | totalHigh | totalLow
  });

  // if admin status changes, default tab
  useEffect(() => {
    setTab((prev) => {
      if (isAdmin) return prev || "all";
      return "mine";
    });
  }, [isAdmin]);

  const canFetch = useMemo(() => {
    if (isAdmin) return true;
    return Boolean(user?.uid || guestUserId);
  }, [isAdmin, user?.uid, guestUserId]);

  const fetchOrders = useCallback(async () => {
    if (!canFetch) {
      setOrders([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ordersRef = collection(db, "orders");
      const allOrders = [];

      if (isAdmin && tab === "all") {
        const allQ = query(ordersRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(allQ);
        snap.docs.forEach((d) => allOrders.push({ id: d.id, ...d.data() }));
      } else {
        if (user?.uid) {
          try {
            const userQ = query(
              ordersRef,
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc"),
            );
            const snap = await getDocs(userQ);
            snap.docs.forEach((d) => allOrders.push({ id: d.id, ...d.data() }));
          } catch (e) {
            console.error("User orders query failed:", e);
          }
        }

        if (guestUserId) {
          try {
            const guestQ = query(
              ordersRef,
              where("guestUserId", "==", guestUserId),
              orderBy("createdAt", "desc"),
            );
            const snap = await getDocs(guestQ);
            snap.docs.forEach((d) => allOrders.push({ id: d.id, ...d.data() }));
          } catch (e) {
            console.error("Guest orders query failed:", e);
          }
        }
      }

      const unique = allOrders.reduce((acc, o) => {
        if (!acc.some((x) => x.id === o.id)) acc.push(o);
        return acc;
      }, []);

      unique.sort((a, b) => safeMillis(b.createdAt) - safeMillis(a.createdAt));
      setOrders(unique);
    } catch (e) {
      console.error("Fetch orders failed:", e);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [canFetch, isAdmin, tab, user?.uid, guestUserId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refreshOrders = useCallback(() => fetchOrders(), [fetchOrders]);

  // ✅ Derived (filtered) list - space-conscious: no extra fetches
  const filteredOrders = useMemo(() => {
    const q = filters.q;
    const status = filters.status;
    const dateRange = filters.dateRange;

    let list = orders;

    if (status && status !== "all") {
      list = list.filter((o) => String(o?.status || "").toLowerCase() === status);
    }

    if (dateRange && dateRange !== "all") {
      list = list.filter((o) => withinRange(o?.createdAt, dateRange));
    }

    if (q && q.trim()) {
      list = list.filter((o) => orderMatchesQuery(o, q));
    }

    const sort = filters.sort;
    const sorted = [...list];

    if (sort === "oldest") {
      sorted.sort((a, b) => safeMillis(a.createdAt) - safeMillis(b.createdAt));
    } else if (sort === "totalHigh") {
      sorted.sort((a, b) => (b?.total ?? 0) - (a?.total ?? 0));
    } else if (sort === "totalLow") {
      sorted.sort((a, b) => (a?.total ?? 0) - (b?.total ?? 0));
    } else {
      // newest
      sorted.sort((a, b) => safeMillis(b.createdAt) - safeMillis(a.createdAt));
    }

    return sorted;
  }, [orders, filters]);

  const stats = useMemo(() => buildStats(filteredOrders), [filteredOrders]);

  const clearFilters = useCallback(() => {
    setFilters({ q: "", status: "all", dateRange: "all", sort: "newest" });
  }, []);

  // ✅ Admin actions
  const updateOrder = useCallback(
    async (orderId, payload) => {
      if (!isAdmin) throw new Error("Not allowed");
      if (!orderId) return;

      await updateDoc(doc(db, "orders", orderId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...payload } : o)),
      );
    },
    [isAdmin],
  );

  const deleteOrder = useCallback(
    async (orderId) => {
      if (!isAdmin) throw new Error("Not allowed");
      if (!orderId) return;

      await deleteDoc(doc(db, "orders", orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    },
    [isAdmin],
  );

  const exportOrdersToCsv = useCallback(
    (exportList, filenamePrefix = "orders") => {
      const header = [
        "orderId",
        "createdAt",
        "status",
        "total",
        "email",
        "phone",
        "userId",
        "guestUserId",
        "paymentReference",
        "paymentProvider",
        "paymentStatus",
        "billingFullName",
        "billingAddress",
        "billingCity",
        "billingState",
        "billingZip",
        "billingCountry",
        "deliveryStatus",
        "courier",
        "trackingNumber",
        "deliveryNotes",
        "itemName",
        "itemSku",
        "itemQty",
        "itemUnitPrice",
        "itemVariant",
        "extrasSummary",
      ];

      const rows = [header];
      (exportList || []).forEach((o) => {
        const flattened = flattenOrderForCsv(o);
        flattened.forEach((r) => rows.push(r));
      });

      const filename = `${filenamePrefix}_${tab}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      downloadCsv(filename, rows);
    },
    [tab],
  );

  const value = useMemo(
    () => ({
      isAdmin,
      tab,
      setTab,

      // raw + derived
      orders,
      filteredOrders,
      stats,

      // loading/errors
      loading,
      error,
      canFetch,

      // filters
      filters,
      setFilters,
      clearFilters,

      // actions
      refreshOrders,
      updateOrder,
      deleteOrder,
      exportOrdersToCsv,
    }),
    [
      isAdmin,
      tab,
      orders,
      filteredOrders,
      stats,
      loading,
      error,
      canFetch,
      filters,
      setFilters,
      clearFilters,
      refreshOrders,
      updateOrder,
      deleteOrder,
      exportOrdersToCsv,
    ],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
