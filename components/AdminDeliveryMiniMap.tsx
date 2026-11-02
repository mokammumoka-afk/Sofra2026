'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import {
  LatLng,
  LIBYAN_CITY_COORDINATES,
  LIBYAN_DISTRICT_COORDINATES,
  resolveLocationCoordinates,
  calculateDistanceKm,
  calculateBearing,
  generateRouteWaypoints,
  getPositionAlongRoute,
} from '@/lib/delivery/coordinates';
import {
  MapPin,
  Navigation,
  Car,
  ChefHat,
  Home,
  Compass,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Phone,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  ChevronRight,
  Filter,
  Eye,
  Radio,
} from 'lucide-react';

interface AdminDeliveryMiniMapProps {
  orders: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onSelectOrder?: (order: Order) => void;
  className?: string;
}

type MapTheme = 'positron' | 'dark' | 'osm';

interface MapViewport {
  centerLat: number;
  centerLng: number;
  zoom: number;
}

export const AdminDeliveryMiniMap: React.FC<AdminDeliveryMiniMapProps> = ({
  orders,
  onUpdateOrderStatus,
  onSelectOrder,
  className = '',
}) => {
  // Filter only orders that are in an active logistics state
  const activeOrders = useMemo(() => {
    return orders.filter((o) =>
      ['accepted', 'preparing', 'out_for_delivery'].includes(o.status)
    );
  }, [orders]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => {
    const firstDelivery = activeOrders.find((o) => o.status === 'out_for_delivery');
    return firstDelivery ? firstDelivery.id : activeOrders[0]?.id || null;
  });

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'out_for_delivery' | 'preparing'>('all');
  const [mapTheme, setMapTheme] = useState<MapTheme>('positron');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(true);

  // Dynamic live progress simulation state: orderId -> progress (0.0 to 1.0)
  const [orderProgressMap, setOrderProgressMap] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    activeOrders.forEach((o) => {
      initialMap[o.id] = (o.delivery_progress_percent ? o.delivery_progress_percent / 100 : 0.5);
    });
    return initialMap;
  });

  // Map viewport state
  const [viewport, setViewport] = useState<MapViewport>({
    centerLat: 32.8872,
    centerLng: 13.1913,
    zoom: 12.5,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 400 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (mapContainerRef.current) {
        const { clientWidth, clientHeight } = mapContainerRef.current;
        setContainerDimensions({
          width: clientWidth || 800,
          height: clientHeight || 400,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isExpanded]);

  // Filtered orders list based on controls
  const filteredActiveOrders = useMemo(() => {
    return activeOrders.filter((order) => {
      if (selectedCity !== 'all' && order.delivery_city !== selectedCity) return false;
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      return true;
    });
  }, [activeOrders, selectedCity, statusFilter]);

  // Selected order details
  const selectedOrder = useMemo(() => {
    return activeOrders.find((o) => o.id === selectedOrderId) || filteredActiveOrders[0] || null;
  }, [activeOrders, selectedOrderId, filteredActiveOrders]);

  // Center on selected order when it changes
  useEffect(() => {
    if (selectedOrder) {
      const city = selectedOrder.delivery_city || 'طرابلس';
      const cityCenter = LIBYAN_CITY_COORDINATES[city] || LIBYAN_CITY_COORDINATES['طرابلس'];
      
      const pickup = {
        lat: selectedOrder.pickup_lat || resolveLocationCoordinates(selectedOrder.chef_name, city, selectedOrder.chef_id).lat,
        lng: selectedOrder.pickup_lng || resolveLocationCoordinates(selectedOrder.chef_name, city, selectedOrder.chef_id).lng,
      };
      const delivery = {
        lat: selectedOrder.delivery_lat || resolveLocationCoordinates(selectedOrder.delivery_address, city, selectedOrder.id).lat,
        lng: selectedOrder.delivery_lng || resolveLocationCoordinates(selectedOrder.delivery_address, city, selectedOrder.id).lng,
      };
      
      // Center midway between pickup and delivery
      const timer = setTimeout(() => {
        setViewport({
          centerLat: (pickup.lat + delivery.lat) / 2,
          centerLng: (pickup.lng + delivery.lng) / 2,
          zoom: cityCenter.zoom || 13,
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedOrderId, selectedOrder]);

  // Live driver movement simulation tick (animates driver icon forward smoothly)
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setOrderProgressMap((prev) => {
        const next = { ...prev };
        activeOrders.forEach((order) => {
          if (order.status === 'out_for_delivery') {
            const current = next[order.id] ?? (order.delivery_progress_percent ? order.delivery_progress_percent / 100 : 0.4);
            // Advance by 0.005 (0.5% every second)
            let updated = current + 0.004;
            if (updated > 0.98) {
              updated = 0.15; // loop back to pickup for continuous simulation
            }
            next[order.id] = updated;
          }
        });
        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isLiveSimulating, activeOrders]);

  // Convert GPS Coordinates (lat, lng) to pixel offsets relative to map center using Web Mercator
  const latLngToPixels = useCallback(
    (coords: LatLng): { x: number; y: number } => {
      const { centerLat, centerLng, zoom } = viewport;
      const { width, height } = containerDimensions;

      // Scale factor: 256 * 2^zoom
      const scale = 256 * Math.pow(2, zoom);

      // Web Mercator formula
      const x = ((coords.lng + 180) / 360) * scale;
      const latRad = (coords.lat * Math.PI) / 180;
      const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;

      const centerX = ((centerLng + 180) / 360) * scale;
      const centerLatRad = (centerLat * Math.PI) / 180;
      const centerY = ((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2) * scale;

      return {
        x: width / 2 + (x - centerX),
        y: height / 2 + (y - centerY),
      };
    },
    [viewport, containerDimensions]
  );

  // Mouse drag panning logic
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; centerLat: number; centerLng: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      centerLat: viewport.centerLat,
      centerLng: viewport.centerLng,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const scale = 256 * Math.pow(2, viewport.zoom);
    // 360 degrees / scale pixels
    const dLng = -(dx / scale) * 360;
    // Approximate latitude conversion for Libya ~32 deg
    const dLat = (dy / scale) * 360 * Math.cos((viewport.centerLat * Math.PI) / 180);

    setViewport((prev) => ({
      ...prev,
      centerLat: dragStartRef.current!.centerLat + dLat,
      centerLng: dragStartRef.current!.centerLng + dLng,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleZoom = (delta: number) => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(16, Math.max(9, prev.zoom + delta)),
    }));
  };

  const handleCenterCity = (cityName: string) => {
    const coords = LIBYAN_CITY_COORDINATES[cityName] || LIBYAN_CITY_COORDINATES['طرابلس'];
    setViewport({
      centerLat: coords.lat,
      centerLng: coords.lng,
      zoom: coords.zoom || 12.5,
    });
    setSelectedCity(cityName);
  };

  // Generate resolved route information for all active orders
  const processedOrders = useMemo(() => {
    return filteredActiveOrders.map((order) => {
      const city = order.delivery_city || 'طرابلس';
      const pickup: LatLng = {
        lat: order.pickup_lat || resolveLocationCoordinates(order.chef_name, city, order.chef_id).lat,
        lng: order.pickup_lng || resolveLocationCoordinates(order.chef_name, city, order.chef_id).lng,
      };
      const delivery: LatLng = {
        lat: order.delivery_lat || resolveLocationCoordinates(order.delivery_address, city, order.id).lat,
        lng: order.delivery_lng || resolveLocationCoordinates(order.delivery_address, city, order.id).lng,
      };

      const waypoints = generateRouteWaypoints(pickup, delivery, 9);
      const progressFraction = orderProgressMap[order.id] ?? (order.delivery_progress_percent ? order.delivery_progress_percent / 100 : 0.4);
      const { position: driverPos, heading } = getPositionAlongRoute(waypoints, progressFraction);

      const totalDistanceKm = calculateDistanceKm(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
      const remainingDistanceKm = Math.max(0.2, Math.round(totalDistanceKm * (1 - progressFraction) * 10) / 10);
      const driverSpeed = order.status === 'out_for_delivery' ? (order.driver_speed_kmh || 38) : 0;
      const etaMins = order.status === 'out_for_delivery'
        ? Math.max(2, Math.round((remainingDistanceKm / (driverSpeed || 35)) * 60))
        : 25;

      return {
        order,
        pickup,
        delivery,
        waypoints,
        driverPos,
        heading,
        progressFraction,
        totalDistanceKm,
        remainingDistanceKm,
        driverSpeed,
        etaMins,
        isSelected: order.id === selectedOrderId,
      };
    });
  }, [filteredActiveOrders, orderProgressMap, selectedOrderId]);

  // Selected processed order data
  const selectedProcessed = processedOrders.find((p) => p.isSelected) || processedOrders[0];

  // Tile URL based on theme
  const getTileUrl = (x: number, y: number, z: number) => {
    if (mapTheme === 'dark') {
      return `https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
    }
    if (mapTheme === 'osm') {
      return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
    // Default positron (clean light)
    return `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;
  };

  // Compute visible background tiles
  const visibleTiles = useMemo(() => {
    const { centerLat, centerLng, zoom } = viewport;
    const { width, height } = containerDimensions;
    const z = Math.floor(zoom);
    const scale = 256 * Math.pow(2, z);

    const centerTileX = ((centerLng + 180) / 360) * Math.pow(2, z);
    const latRad = (centerLat * Math.PI) / 180;
    const centerTileY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, z);

    const tilesXCount = Math.ceil(width / 256) + 2;
    const tilesYCount = Math.ceil(height / 256) + 2;

    const minX = Math.floor(centerTileX - tilesXCount / 2);
    const maxX = Math.ceil(centerTileX + tilesXCount / 2);
    const minY = Math.floor(centerTileY - tilesYCount / 2);
    const maxY = Math.ceil(centerTileY + tilesYCount / 2);

    const tiles: Array<{ x: number; y: number; z: number; px: number; py: number; key: string }> = [];

    const zoomFrac = Math.pow(2, zoom - z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        // Tile pixel offset from center
        const tileLeft = width / 2 + (x - centerTileX) * 256 * zoomFrac;
        const tileTop = height / 2 + (y - centerTileY) * 256 * zoomFrac;

        tiles.push({
          x: ((x % Math.pow(2, z)) + Math.pow(2, z)) % Math.pow(2, z),
          y,
          z,
          px: tileLeft,
          py: tileTop,
          key: `${z}-${x}-${y}`,
        });
      }
    }
    return tiles;
  }, [viewport, containerDimensions, mapTheme]);

  return (
    <div
      className={`bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
        isExpanded ? 'h-[680px] shadow-2xl ring-2 ring-orange-500/20' : 'h-[440px]'
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="p-3.5 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 select-none border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center">
            <Navigation className="w-4 h-4 fill-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-white">
                خريطة التتبع الميداني الحي للطلبيات 🛰️
              </h3>
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{filteredActiveOrders.length} طلبات نشطة</span>
              </span>
            </div>
            <p className="text-[10px] text-stone-400">تحديث فوري لإحداثيات المناديب ومسار الشحنات نحو الزبائن</p>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex items-center gap-2">
          {/* City selector buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-stone-800 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setSelectedCity('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedCity === 'all' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'
              }`}
            >
              كل المدن
            </button>
            {['طرابلس', 'بنغازي', 'مصراتة'].map((city) => (
              <button
                key={city}
                onClick={() => handleCenterCity(city)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedCity === city ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'out_for_delivery' | 'preparing')}
            className="bg-stone-800 border border-stone-700 text-stone-200 text-[11px] font-bold px-2.5 py-1.5 rounded-xl outline-none"
          >
            <option value="all">كل المراحل</option>
            <option value="out_for_delivery">🚗 خرج للتوصيل</option>
            <option value="preparing">🍳 قيد التحضير</option>
          </select>

          {/* Map Theme Toggle */}
          <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setMapTheme('positron')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                mapTheme === 'positron' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'
              }`}
              title="خريطة فاتحة نقية"
            >
              فاتح
            </button>
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                mapTheme === 'dark' ? 'bg-stone-950 text-orange-400 border border-orange-500/40' : 'text-stone-400 hover:text-white'
              }`}
              title="خريطة ليلية تكتيكية"
            >
              داكن
            </button>
          </div>

          {/* Live Simulation Play/Pause */}
          <button
            onClick={() => setIsLiveSimulating(!isLiveSimulating)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              isLiveSimulating
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-stone-700 hover:bg-stone-600 text-stone-300'
            }`}
            title={isLiveSimulating ? 'إيقاف حركة المناديب مؤقتاً' : 'تشغيل محاكاة حركة المناديب المباشرة'}
          >
            {isLiveSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isLiveSimulating ? 'محاكاة حية ⚡' : 'موقوفة'}</span>
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition-all cursor-pointer"
            title={isExpanded ? 'تصغير الخريطة' : 'توسيع شاشة الخريطة'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Viewport Container */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 w-full overflow-hidden select-none bg-stone-200 cursor-${
          isDragging ? 'grabbing' : 'grab'
        }`}
      >
        {/* Real Map Tiles Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {visibleTiles.map((tile) => (
            <img
              key={tile.key}
              src={getTileUrl(tile.x, tile.y, tile.z)}
              alt=""
              className="absolute w-[256px] h-[256px] object-cover pointer-events-none"
              style={{
                left: `${tile.px}px`,
                top: `${tile.py}px`,
                filter: mapTheme === 'dark' ? 'contrast(105%) brightness(95%)' : 'none',
              }}
              draggable={false}
            />
          ))}
        </div>

        {/* SVG Vector Paths Layer (Routes, Curves, Waypoints) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="routeGradientActive" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {processedOrders.map((item) => {
            const isSelected = item.isSelected;
            // Build SVG path data along waypoints
            const pointsStr = item.waypoints
              .map((pt, idx) => {
                const px = latLngToPixels(pt);
                return `${idx === 0 ? 'M' : 'L'} ${px.x.toFixed(1)} ${px.y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <g key={`route-${item.order.id}`}>
                {/* Route shadow / glow */}
                <path
                  d={pointsStr}
                  fill="none"
                  stroke={isSelected ? '#ea580c' : '#78716c'}
                  strokeWidth={isSelected ? 6 : 3}
                  strokeOpacity={isSelected ? 0.35 : 0.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Main animated dash route line */}
                <path
                  d={pointsStr}
                  fill="none"
                  stroke={isSelected ? 'url(#routeGradientActive)' : '#a8a29e'}
                  strokeWidth={isSelected ? 3.5 : 2}
                  strokeDasharray={isSelected ? '6, 5' : '4, 4'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isSelected ? 'animate-pulse' : ''}
                />
              </g>
            );
          })}
        </svg>

        {/* Marker Elements Layer (Kitchens, Drivers, Destinations) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {processedOrders.map((item) => {
            const pickupPx = latLngToPixels(item.pickup);
            const deliveryPx = latLngToPixels(item.delivery);
            const driverPx = latLngToPixels(item.driverPos);
            const isSelected = item.isSelected;

            return (
              <React.Fragment key={`markers-${item.order.id}`}>
                {/* A. Kitchen / Pickup Marker */}
                <div
                  style={{
                    left: `${pickupPx.x}px`,
                    top: `${pickupPx.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderId(item.order.id);
                  }}
                  className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 group ${
                    isSelected ? 'z-40 scale-110' : 'z-20 hover:scale-105'
                  }`}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-orange-500/40">
                      <ChefHat className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <div className="bg-stone-900/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-1 shadow-md whitespace-nowrap border border-white/20">
                        مطبخ: {item.order.chef_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* B. Destination / Customer Delivery Marker */}
                <div
                  style={{
                    left: `${deliveryPx.x}px`,
                    top: `${deliveryPx.y}px`,
                    transform: 'translate(-50%, -100%)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderId(item.order.id);
                  }}
                  className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 group ${
                    isSelected ? 'z-40 scale-110' : 'z-20 hover:scale-105'
                  }`}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-500/40">
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="w-2 h-2 bg-emerald-600 rotate-45 -mt-1 shadow-xs"></div>
                    {isSelected && (
                      <div className="bg-emerald-950/90 text-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-0.5 shadow-md whitespace-nowrap border border-emerald-500/30">
                        الزبون: {item.order.customer_name} ({item.remainingDistanceKm} كم)
                      </div>
                    )}
                  </div>
                </div>

                {/* C. Live Courier Vehicle Marker */}
                <div
                  style={{
                    left: `${driverPx.x}px`,
                    top: `${driverPx.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderId(item.order.id);
                  }}
                  className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 ${
                    isSelected ? 'z-50 scale-125' : 'z-30 hover:scale-110'
                  }`}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Live Ping Ring */}
                    <div className="absolute -inset-2 rounded-full bg-orange-500/30 animate-ping"></div>

                    {/* Vehicle Badge */}
                    <div
                      style={{
                        transform: `rotate(${item.heading || 0}deg)`,
                      }}
                      className="w-10 h-10 rounded-2xl bg-stone-900 text-orange-400 border-2 border-orange-500 flex items-center justify-center shadow-2xl transition-transform duration-300"
                    >
                      <Car className="w-5 h-5 fill-orange-400 text-stone-900" />
                    </div>

                    {/* Driver Mini Badge on Map */}
                    <div className="mt-1 bg-stone-950/95 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-orange-500/40 whitespace-nowrap flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{item.order.driver_name || 'مندوب التوصيل'}</span>
                      <span className="text-orange-400 font-mono">({item.driverSpeed} كم/س)</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Map Floating Navigation Controls */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
          <button
            onClick={() => handleZoom(1)}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-stone-800 shadow-md border border-stone-200 flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
            title="تكبير الخريطة"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-stone-800 shadow-md border border-stone-200 flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
            title="تصغير الخريطة"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (selectedProcessed) {
                setViewport({
                  centerLat: selectedProcessed.driverPos.lat,
                  centerLng: selectedProcessed.driverPos.lng,
                  zoom: 13.5,
                });
              } else {
                handleCenterCity(selectedCity !== 'all' ? selectedCity : 'طرابلس');
              }
            }}
            className="w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="تركيز الكاميرا على المندوب المحدد"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Order Real-Time Telemetry HUD Overlay (Bottom of map) */}
        {selectedProcessed && (
          <div className="absolute bottom-3 inset-x-3 z-30 pointer-events-auto">
            <div className="bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-3 border border-orange-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedProcessed.order.post_image}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-orange-500/30 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-orange-400">
                      #{selectedProcessed.order.id}
                    </span>
                    <span className="font-extrabold text-xs text-white truncate">
                      {selectedProcessed.order.post_title}
                    </span>
                    <span className="bg-orange-500/20 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                      {selectedProcessed.order.delivery_provider === 'talabk'
                        ? 'طلبك للتوصيل'
                        : selectedProcessed.order.delivery_provider === 'drubi'
                        ? 'دروبي Drubi'
                        : 'أكسبرس ليبيا'}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-300 flex flex-wrap items-center gap-2.5 mt-1">
                    <span>
                      👨‍🍳 مطبخ: <span className="font-bold text-white">{selectedProcessed.order.chef_name}</span>
                    </span>
                    <span>←</span>
                    <span>
                      🏠 زبون: <span className="font-bold text-white">{selectedProcessed.order.customer_name}</span> ({selectedProcessed.order.delivery_address})
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Telemetry Stats (Speed, Distance, ETA, Driver) */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-right">
                <div className="bg-stone-800/80 px-2.5 py-1.5 rounded-xl border border-stone-700/60 text-center">
                  <div className="text-[9px] text-stone-400 font-bold">السرعة الحالية</div>
                  <div className="font-mono font-black text-xs text-emerald-400">
                    {selectedProcessed.driverSpeed} كم/س
                  </div>
                </div>

                <div className="bg-stone-800/80 px-2.5 py-1.5 rounded-xl border border-stone-700/60 text-center">
                  <div className="text-[9px] text-stone-400 font-bold">المتبقي للوجهة</div>
                  <div className="font-mono font-black text-xs text-amber-300">
                    {selectedProcessed.remainingDistanceKm} كم
                  </div>
                </div>

                <div className="bg-stone-800/80 px-2.5 py-1.5 rounded-xl border border-stone-700/60 text-center">
                  <div className="text-[9px] text-stone-400 font-bold">وقت الوصول التقديري</div>
                  <div className="font-mono font-black text-xs text-orange-400">
                    ~{selectedProcessed.etaMins} دقيقة
                  </div>
                </div>

                {/* Driver Contact & Fast Actions */}
                <div className="flex items-center gap-1.5">
                  {selectedProcessed.order.driver_phone && (
                    <a
                      href={`tel:${selectedProcessed.order.driver_phone}`}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-200 p-2 rounded-xl border border-stone-700 transition-colors flex items-center justify-center cursor-pointer"
                      title={`اتصال بالمندوب (${selectedProcessed.order.driver_name})`}
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                    </a>
                  )}

                  {onUpdateOrderStatus && (
                    <button
                      onClick={() => {
                        onUpdateOrderStatus(selectedProcessed.order.id, 'delivered');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تأكيد التسليم فوراً</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Quick Fleet List Cards Carousel */}
      <div className="p-2.5 bg-stone-50 border-t border-stone-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-black text-stone-700 whitespace-nowrap pl-1 flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-orange-600" />
          <span>الشحنات الحية:</span>
        </span>

        {processedOrders.length === 0 ? (
          <div className="text-xs text-stone-500 font-bold py-1 px-3">
            لا توجد طلبيات قيد التوصيل أو التحضير في التصفية الحالية.
          </div>
        ) : (
          processedOrders.map((item) => (
            <button
              key={item.order.id}
              onClick={() => {
                setSelectedOrderId(item.order.id);
                if (onSelectOrder) onSelectOrder(item.order);
              }}
              className={`px-3 py-1.5 rounded-xl text-right transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                item.isSelected
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-200/90 hover:border-orange-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  item.order.status === 'out_for_delivery'
                    ? item.isSelected
                      ? 'bg-white animate-ping'
                      : 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <div className="text-right">
                <div className="font-extrabold text-[11px] flex items-center gap-1">
                  <span>#{item.order.id}</span>
                  <span className="opacity-90">• {item.order.customer_name}</span>
                </div>
                <div className={`text-[9px] ${item.isSelected ? 'text-orange-100' : 'text-stone-500'}`}>
                  {item.order.delivery_city} • {item.remainingDistanceKm} كم (~{item.etaMins} د)
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
