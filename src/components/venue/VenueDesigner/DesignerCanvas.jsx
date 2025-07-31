import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../../common/SafeIcon';

const { FiZoomIn, FiZoomOut, FiMove } = FiIcons;

const DesignerCanvas = ({
  elements = [],
  onElementsChange,
  selectedTool,
  selectedElement,
  onElementSelect,
  canvasSettings = { width: 800, height: 600 },
  showGrid = true,
  // New category props
  categories = {},
  selectedCategory = null
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // States for polygon creation
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isCreatingPolygon, setIsCreatingPolygon] = useState(false);

  // States for element manipulation
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [moveStart, setMoveStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState(null);

  // Constants for resize handle size
  const RESIZE_HANDLE_SIZE = 10;

  // Canvas drawing functions
  const drawGrid = useCallback((ctx, width, height) => {
    if (!showGrid) return;
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    
    const gridSize = 20 * scale;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;

    // Vertical lines
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [scale, pan, showGrid]);

  const drawStage = useCallback((ctx, stage) => {
    const x = stage.x * scale + pan.x;
    const y = stage.y * scale + pan.y;
    const width = (stage.width || 200) * scale;
    const height = (stage.height || 40) * scale;
    const isSelected = selectedElement?.id === stage.id;

    // Stage background
    ctx.fillStyle = stage.color || '#6B7280';
    ctx.fillRect(x, y, width, height);

    // Selected border
    if (isSelected) {
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw resize handles
      drawResizeHandles(ctx, x, y, width, height);
    }

    // Stage label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${12 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(stage.label || 'STAGE', x + width / 2, y + height / 2 + 4);
  }, [scale, pan, selectedElement]);

  const drawSeat = useCallback((ctx, seat, isSelected = false) => {
    const x = seat.x * scale + pan.x;
    const y = seat.y * scale + pan.y;
    const size = (seat.size || 20) * scale;
    
    // Check if seat is bookable
    const isBookable = seat.is_bookable !== false;

    // Get color from category or fallback
    let seatColor = '#3B82F6'; // Default blue
    if (seat.categoryId && categories[seat.categoryId]) {
      seatColor = categories[seat.categoryId].color;
    }
    
    // Apply opacity if not bookable
    if (!isBookable) {
      ctx.globalAlpha = 0.4;
    }

    // Seat background
    ctx.fillStyle = isSelected ? '#FCD34D' : seatColor;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 4 * scale);
    ctx.fill();

    // Seat border
    if (isSelected) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw resize handles for seats
      drawResizeHandles(ctx, x, y, size, size);
    }

    // Seat number
    if (seat.number) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.min(10 * scale, size * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(seat.number, x + size / 2, y + size / 2 + 3);
    }

    // Category indicator (small dot in corner)
    if (seat.categoryId && categories[seat.categoryId]) {
      ctx.fillStyle = categories[seat.categoryId].color;
      ctx.beginPath();
      ctx.arc(x + size - 4, y + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
  }, [scale, pan, categories]);

  const drawSection = useCallback((ctx, section, isSelected = false) => {
    const x = section.x * scale + pan.x;
    const y = section.y * scale + pan.y;
    const width = (section.width || 100) * scale;
    const height = (section.height || 80) * scale;
    
    // Check if section is bookable
    const isBookable = section.is_bookable !== false;

    // Get color from category or fallback
    let sectionColor = '#3B82F6';
    if (section.categoryId && categories[section.categoryId]) {
      sectionColor = categories[section.categoryId].color;
    }
    
    // Apply opacity if not bookable
    if (!isBookable) {
      ctx.globalAlpha = 0.4;
    }

    // Section background
    ctx.fillStyle = isSelected ? 'rgba(251,191,36,0.3)' : `${sectionColor}33`; // 20% opacity
    ctx.fillRect(x, y, width, height);

    // Section border
    ctx.strokeStyle = isSelected ? '#FCD34D' : sectionColor;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(x, y, width, height);
    
    // Draw resize handles if selected
    if (isSelected) {
      drawResizeHandles(ctx, x, y, width, height);
    }

    // Section label
    if (section.label) {
      ctx.fillStyle = isSelected ? '#92400E' : '#1F2937';
      ctx.font = `bold ${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(section.label, x + width / 2, y + height / 2);
    }
    
    // If section has capacity > 1, show capacity indicator
    if (section.capacity > 1) {
      const capacityText = `${section.capacity} seats`;
      ctx.fillStyle = isSelected ? '#92400E' : '#1F2937';
      ctx.font = `${10 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(capacityText, x + width / 2, y + height / 2 + 18 * scale);
    }
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
  }, [scale, pan, categories]);

  const drawPolygon = useCallback((ctx, polygon, isSelected = false) => {
    if (!polygon.points || polygon.points.length < 3) return;
    
    const points = polygon.points.map(point => ({
      x: point.x * scale + pan.x,
      y: point.y * scale + pan.y
    }));
    
    // Check if polygon is bookable
    const isBookable = polygon.is_bookable !== false;

    // Get color from category or fallback
    let polygonColor = '#3B82F6';
    if (polygon.categoryId && categories[polygon.categoryId]) {
      polygonColor = categories[polygon.categoryId].color;
    }
    
    // Apply opacity if not bookable
    if (!isBookable) {
      ctx.globalAlpha = 0.4;
    }

    // Draw polygon
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    // Fill polygon
    ctx.fillStyle = isSelected ? 'rgba(251,191,36,0.3)' : `${polygonColor}33`;
    ctx.fill();

    // Stroke polygon
    ctx.strokeStyle = isSelected ? '#FCD34D' : polygonColor;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();

    // Draw points for selected polygon
    if (isSelected) {
      points.forEach((point, index) => {
        ctx.fillStyle = '#FCD34D';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw label
    if (polygon.label) {
      const center = findPolygonCenter(points);
      ctx.fillStyle = isSelected ? '#92400E' : '#1F2937';
      ctx.font = `bold ${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(polygon.label, center.x, center.y);
      
      // If polygon has capacity > 1, show capacity indicator
      if (polygon.capacity > 1) {
        const capacityText = `${polygon.capacity} seats`;
        ctx.fillStyle = isSelected ? '#92400E' : '#1F2937';
        ctx.font = `${10 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(capacityText, center.x, center.y + 18 * scale);
      }
    }
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
  }, [scale, pan, categories]);

  // Helper to find center of polygon
  const findPolygonCenter = (points) => {
    let sumX = 0;
    let sumY = 0;
    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  };

  // Draw resize handles for selected elements
  const drawResizeHandles = (ctx, x, y, width, height) => {
    const handlePositions = [
      { x: x, y: y, cursor: 'nwse-resize', position: 'nw' }, // top-left
      { x: x + width / 2, y: y, cursor: 'ns-resize', position: 'n' }, // top-center
      { x: x + width, y: y, cursor: 'nesw-resize', position: 'ne' }, // top-right
      { x: x, y: y + height / 2, cursor: 'ew-resize', position: 'w' }, // middle-left
      { x: x + width, y: y + height / 2, cursor: 'ew-resize', position: 'e' }, // middle-right
      { x: x, y: y + height, cursor: 'nesw-resize', position: 'sw' }, // bottom-left
      { x: x + width / 2, y: y + height, cursor: 'ns-resize', position: 's' }, // bottom-center
      { x: x + width, y: y + height, cursor: 'nwse-resize', position: 'se' } // bottom-right
    ];

    ctx.fillStyle = '#FCD34D';
    handlePositions.forEach(handle => {
      ctx.beginPath();
      ctx.rect(
        handle.x - RESIZE_HANDLE_SIZE / 2,
        handle.y - RESIZE_HANDLE_SIZE / 2,
        RESIZE_HANDLE_SIZE,
        RESIZE_HANDLE_SIZE
      );
      ctx.fill();
    });
  };

  // Draw in-progress polygon
  const drawInProgressPolygon = useCallback((ctx) => {
    if (polygonPoints.length < 1) return;

    const scaledPoints = polygonPoints.map(point => ({
      x: point.x * scale + pan.x,
      y: point.y * scale + pan.y
    }));

    // Draw lines connecting existing points
    ctx.beginPath();
    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
    for (let i = 1; i < scaledPoints.length; i++) {
      ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
    }

    // Draw points
    scaledPoints.forEach(point => {
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw stroke
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [polygonPoints, scale, pan]);

  const drawElements = useCallback((ctx) => {
    elements.forEach(element => {
      const isSelected = selectedElement?.id === element.id;

      switch (element.type) {
        case 'seat':
          drawSeat(ctx, element, isSelected);
          break;
        case 'section':
          drawSection(ctx, element, isSelected);
          break;
        case 'polygon':
          drawPolygon(ctx, element, isSelected);
          break;
        case 'stage':
          drawStage(ctx, element, isSelected);
          break;
        default:
          break;
      }
    });

    // Draw polygon in progress if we're creating one
    if (isCreatingPolygon && polygonPoints.length > 0) {
      drawInProgressPolygon(ctx);
    }
  }, [
    elements,
    selectedElement,
    drawSeat,
    drawSection,
    drawPolygon,
    drawStage,
    isCreatingPolygon,
    polygonPoints,
    drawInProgressPolygon
  ]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw elements
    drawElements(ctx);
  }, [drawGrid, drawElements]);

  // Event handlers
  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  }, [scale, pan]);

  // Check if point is inside element
  const isPointInElement = useCallback((point, element) => {
    if (element.type === 'seat') {
      const size = element.size || 20;
      return (
        point.x >= element.x && 
        point.x <= element.x + size && 
        point.y >= element.y && 
        point.y <= element.y + size
      );
    } else if (element.type === 'section' || element.type === 'stage') {
      const width = element.width || 100;
      const height = element.height || 80;
      return (
        point.x >= element.x && 
        point.x <= element.x + width && 
        point.y >= element.y && 
        point.y <= element.y + height
      );
    } else if (element.type === 'polygon') {
      return isPointInPolygon(point, element.points);
    }
    return false;
  }, []);

  // Check if point is in polygon using ray casting algorithm
  const isPointInPolygon = (point, polygonPoints) => {
    if (!polygonPoints || polygonPoints.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
      const xi = polygonPoints[i].x;
      const yi = polygonPoints[i].y;
      const xj = polygonPoints[j].x;
      const yj = polygonPoints[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Check if point is on a resize handle
  const getResizeHandle = useCallback((point, element) => {
    if (!element) return null;
    
    let x, y, width, height;
    
    if (element.type === 'seat') {
      x = element.x * scale + pan.x;
      y = element.y * scale + pan.y;
      width = (element.size || 20) * scale;
      height = (element.size || 20) * scale;
    } else if (element.type === 'section' || element.type === 'stage') {
      x = element.x * scale + pan.x;
      y = element.y * scale + pan.y;
      width = (element.width || 100) * scale;
      height = (element.height || 80) * scale;
    } else if (element.type === 'polygon') {
      // For polygons, check if we're near any point
      if (element.points) {
        for (let i = 0; i < element.points.length; i++) {
          const px = element.points[i].x * scale + pan.x;
          const py = element.points[i].y * scale + pan.y;
          
          if (
            point.x >= px - RESIZE_HANDLE_SIZE / 2 &&
            point.x <= px + RESIZE_HANDLE_SIZE / 2 &&
            point.y >= py - RESIZE_HANDLE_SIZE / 2 &&
            point.y <= py + RESIZE_HANDLE_SIZE / 2
          ) {
            return { position: `point-${i}`, cursor: 'move' };
          }
        }
      }
      return null;
    } else {
      return null;
    }

    // Check each resize handle
    const handles = [
      { x: x, y: y, cursor: 'nwse-resize', position: 'nw' }, // top-left
      { x: x + width / 2, y: y, cursor: 'ns-resize', position: 'n' }, // top-center
      { x: x + width, y: y, cursor: 'nesw-resize', position: 'ne' }, // top-right
      { x: x, y: y + height / 2, cursor: 'ew-resize', position: 'w' }, // middle-left
      { x: x + width, y: y + height / 2, cursor: 'ew-resize', position: 'e' }, // middle-right
      { x: x, y: y + height, cursor: 'nesw-resize', position: 'sw' }, // bottom-left
      { x: x + width / 2, y: y + height, cursor: 'ns-resize', position: 's' }, // bottom-center
      { x: x + width, y: y + height, cursor: 'nwse-resize', position: 'se' } // bottom-right
    ];

    for (const handle of handles) {
      if (
        point.x >= handle.x - RESIZE_HANDLE_SIZE &&
        point.x <= handle.x + RESIZE_HANDLE_SIZE &&
        point.y >= handle.y - RESIZE_HANDLE_SIZE &&
        point.y <= handle.y + RESIZE_HANDLE_SIZE
      ) {
        return { position: handle.position, cursor: handle.cursor };
      }
    }
    
    return null;
  }, [scale, pan]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const pos = getMousePos(e);

    if (selectedTool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: clientX, y: clientY });
      setPanStart({ x: pan.x, y: pan.y });
      return;
    }

    // Check if we're creating a polygon
    if (selectedTool === 'polygon') {
      if (!isCreatingPolygon) {
        // Start creating a polygon
        setIsCreatingPolygon(true);
        setPolygonPoints([pos]);
      } else {
        // Continue adding points to polygon
        // Check if we're close to the first point to close the polygon
        if (polygonPoints.length > 2) {
          const firstPoint = polygonPoints[0];
          const dx = pos.x - firstPoint.x;
          const dy = pos.y - firstPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 20 / scale) { // 20 pixels / scale factor
            // Close the polygon and create it
            const newPolygon = {
              id: Date.now().toString(),
              type: 'polygon',
              points: [...polygonPoints],
              categoryId: selectedCategory || null,
              capacity: 1, // Default capacity
              is_bookable: true // Default bookable
            };
            
            onElementsChange([...elements, newPolygon]);
            onElementSelect(newPolygon);
            
            // Reset polygon creation state
            setIsCreatingPolygon(false);
            setPolygonPoints([]);
            return;
          }
        }
        
        // Add a new point
        setPolygonPoints([...polygonPoints, pos]);
      }
      
      return;
    }

    // Check if we're clicking on a selected element's resize handle
    if (selectedElement) {
      const handle = getResizeHandle({ x: clientX, y: clientY }, selectedElement);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart({ x: clientX, y: clientY });
        setElementStart({ ...selectedElement });
        return;
      }
    }

    // Check if clicking on existing element
    const clickedElement = elements.find(element => isPointInElement(pos, element));
    if (clickedElement) {
      onElementSelect(clickedElement);
      
      // Handle element movement if using select tool
      if (selectedTool === 'select') {
        setIsMoving(true);
        setDragStart({ x: clientX, y: clientY });
        setMoveStart({ x: pos.x, y: pos.y });
        setElementStart({ ...clickedElement });
        return;
      }

      // Paint category tool
      if (selectedTool === 'paint-category' && selectedCategory) {
        if (clickedElement.type === 'seat' || clickedElement.type === 'section' || clickedElement.type === 'polygon') {
          const updatedElement = { ...clickedElement, categoryId: selectedCategory };
          onElementsChange(elements.map(el => el.id === clickedElement.id ? updatedElement : el));
        }
      }
      
      return;
    }

    // Create new element based on selected tool
    if (selectedTool === 'seat') {
      const newSeat = {
        id: Date.now().toString(),
        type: 'seat',
        x: pos.x,
        y: pos.y,
        size: 20,
        number: `${elements.filter(e => e.type === 'seat').length + 1}`,
        categoryId: selectedCategory || null, // Assign selected category
        is_bookable: true // Default bookable
      };
      
      onElementsChange([...elements, newSeat]);
      onElementSelect(newSeat);
    } else if (selectedTool === 'section') {
      const newSection = {
        id: Date.now().toString(),
        type: 'section',
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 80,
        label: `Section ${String.fromCharCode(65 + elements.filter(e => e.type === 'section').length)}`,
        categoryId: selectedCategory || null,
        capacity: 1, // Default capacity
        is_bookable: true // Default bookable
      };
      
      onElementsChange([...elements, newSection]);
      onElementSelect(newSection);
    } else if (selectedTool === 'stage') {
      const newStage = {
        id: Date.now().toString(),
        type: 'stage',
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 40,
        color: '#6B7280',
        label: 'STAGE'
      };
      
      onElementsChange([...elements, newStage]);
      onElementSelect(newStage);
    }
  }, [
    selectedTool,
    elements,
    onElementsChange,
    onElementSelect,
    getMousePos,
    pan,
    isCreatingPolygon,
    polygonPoints,
    selectedCategory,
    isPointInElement,
    selectedElement,
    getResizeHandle,
    scale
  ]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const pos = getMousePos(e);

    // Handle panning
    if (isDragging && selectedTool === 'pan') {
      setPan({
        x: panStart.x + clientX - dragStart.x,
        y: panStart.y + clientY - dragStart.y
      });
      return;
    }

    // Handle resizing
    if (isResizing && selectedElement && elementStart) {
      const dx = (clientX - dragStart.x) / scale;
      const dy = (clientY - dragStart.y) / scale;
      
      let updatedElement = { ...selectedElement };
      
      if (selectedElement.type === 'seat') {
        // For seats, just resize in all directions equally
        const newSize = Math.max(10, elementStart.size + dx);
        updatedElement = { ...updatedElement, size: newSize };
      } else if (selectedElement.type === 'section' || selectedElement.type === 'stage') {
        // Handle based on which resize handle was grabbed
        const { position } = resizeHandle;
        
        // Update width and height
        let newX = elementStart.x;
        let newY = elementStart.y;
        let newWidth = elementStart.width;
        let newHeight = elementStart.height;
        
        // Horizontal changes
        if (position.includes('w')) {
          // Left side
          newX = elementStart.x + dx;
          newWidth = Math.max(20, elementStart.width - dx);
        } else if (position.includes('e')) {
          // Right side
          newWidth = Math.max(20, elementStart.width + dx);
        }
        
        // Vertical changes
        if (position.includes('n')) {
          // Top side
          newY = elementStart.y + dy;
          newHeight = Math.max(20, elementStart.height - dy);
        } else if (position.includes('s')) {
          // Bottom side
          newHeight = Math.max(20, elementStart.height + dy);
        }
        
        updatedElement = { ...updatedElement, x: newX, y: newY, width: newWidth, height: newHeight };
      } else if (selectedElement.type === 'polygon' && resizeHandle.position.startsWith('point-')) {
        // For polygon, move the specific point
        const pointIndex = parseInt(resizeHandle.position.split('-')[1]);
        const newPoints = [...selectedElement.points];
        newPoints[pointIndex] = {
          x: elementStart.points[pointIndex].x + dx,
          y: elementStart.points[pointIndex].y + dy
        };
        updatedElement = { ...updatedElement, points: newPoints };
      }
      
      onElementsChange(elements.map(el => el.id === selectedElement.id ? updatedElement : el));
      onElementSelect(updatedElement);
      return;
    }

    // Handle moving elements
    if (isMoving && selectedElement && elementStart) {
      const dx = pos.x - moveStart.x;
      const dy = pos.y - moveStart.y;
      
      let updatedElement = { ...selectedElement };
      
      if (selectedElement.type === 'polygon') {
        // Move all points
        const newPoints = elementStart.points.map(point => ({
          x: point.x + dx,
          y: point.y + dy
        }));
        updatedElement = { ...updatedElement, points: newPoints };
      } else {
        // Move x, y position
        updatedElement = { ...updatedElement, x: elementStart.x + dx, y: elementStart.y + dy };
      }
      
      onElementsChange(elements.map(el => el.id === selectedElement.id ? updatedElement : el));
      onElementSelect(updatedElement);
      return;
    }

    // Update cursor based on tool and context
    if (containerRef.current) {
      if (selectedTool === 'pan') {
        containerRef.current.style.cursor = isDragging ? 'grabbing' : 'grab';
      } else if (selectedTool === 'paint-category') {
        containerRef.current.style.cursor = selectedCategory ? 'crosshair' : 'not-allowed';
      } else if (selectedTool === 'select') {
        // Check if we're over a resize handle of the selected element
        if (selectedElement) {
          const handle = getResizeHandle({ x: clientX, y: clientY }, selectedElement);
          if (handle) {
            containerRef.current.style.cursor = handle.cursor;
            return;
          }
          
          // Check if we're over any element (for moving)
          const overElement = elements.find(element => isPointInElement(pos, element));
          containerRef.current.style.cursor = overElement ? 'move' : 'default';
        } else {
          containerRef.current.style.cursor = 'default';
        }
      } else {
        containerRef.current.style.cursor = 'crosshair';
      }
    }
  }, [
    isDragging,
    selectedTool,
    dragStart,
    panStart,
    scale,
    getMousePos,
    pan,
    elements,
    selectedElement,
    isResizing,
    elementStart,
    resizeHandle,
    onElementsChange,
    onElementSelect,
    isMoving,
    moveStart,
    isPointInElement,
    selectedCategory,
    getResizeHandle
  ]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsMoving(false);
    setResizeHandle(null);
    setElementStart(null);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.1), 3));
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev * 0.8, 0.1));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle double-click to end polygon creation
  const handleDoubleClick = useCallback((e) => {
    if (selectedTool === 'polygon' && isCreatingPolygon && polygonPoints.length > 2) {
      // Create the polygon and finish
      const newPolygon = {
        id: Date.now().toString(),
        type: 'polygon',
        points: [...polygonPoints],
        categoryId: selectedCategory || null,
        capacity: 1, // Default capacity
        is_bookable: true // Default bookable
      };
      
      onElementsChange([...elements, newPolygon]);
      onElementSelect(newPolygon);
      
      // Reset polygon creation state
      setIsCreatingPolygon(false);
      setPolygonPoints([]);
    }
  }, [selectedTool, isCreatingPolygon, polygonPoints, elements, onElementsChange, onElementSelect, selectedCategory]);

  // Setup canvas and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={zoomIn}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Zoom In"
        >
          <SafeIcon icon={FiZoomIn} className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Zoom Out"
        >
          <SafeIcon icon={FiZoomOut} className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Reset View"
        >
          <SafeIcon icon={FiMove} className="w-4 h-4" />
        </button>
      </div>
      
      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 z-10 bg-zinc-700 text-white px-3 py-1 rounded-lg text-sm">
        {Math.round(scale * 100)}%
      </div>
      
      {/* Canvas Container */}
      <div ref={containerRef} className="w-full h-full">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className="w-full h-full"
        />
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-zinc-800/90 text-white p-3 rounded-lg text-sm max-w-xs">
        <h4 className="font-medium mb-2">Categories:</h4>
        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
          {Object.entries(categories).map(([categoryId, category]) => (
            <div key={categoryId} className="flex items-center">
              <div
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="text-xs">{categoryId}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-zinc-800/90 text-white p-3 rounded-lg text-sm max-w-xs">
        <div className="space-y-1">
          <div><strong>Mouse Wheel:</strong> Zoom in/out</div>
          <div><strong>Pan Tool:</strong> Click and drag to move view</div>
          <div><strong>Paint Category:</strong> Click elements to assign category</div>
          {selectedTool === 'polygon' && (
            <div className="text-yellow-400"><strong>Polygon Tool:</strong> Click to add points, double-click to finish</div>
          )}
          {selectedTool === 'select' && (
            <div className="text-yellow-400"><strong>Select Tool:</strong> Drag to move, handles to resize</div>
          )}
          {selectedTool === 'paint-category' && !selectedCategory && (
            <div className="text-yellow-400"><strong>Select a category first!</strong></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignerCanvas;