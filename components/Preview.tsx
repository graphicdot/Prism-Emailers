import React, { useEffect, useRef, useState } from 'react';
import { SelectedElement } from '../types';

interface PreviewProps {
  htmlContent: string;
  onSelectElement: (el: SelectedElement) => void;
}

export const Preview: React.FC<PreviewProps> = ({ htmlContent, onSelectElement }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  // Function to inject script into iframe to handle clicks
  const injectInteractionScript = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;

    // Add some basic hover styles for editable elements
    const style = doc.createElement('style');
    style.textContent = `
      [data-prism-editable]:hover {
        outline: 2px dashed #4f46e5 !important;
        cursor: pointer !important;
        position: relative;
      }
    `;
    doc.head.appendChild(style);

    // Identify editable elements
    const editableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'IMG', 'SPAN', 'LI', 'TD', 'DIV'];
    
    // Recursive function to generate simple XPath
    const getSimpleXPath = (node: Node): string => {
        if (!node.parentNode) return '';
        if (node.nodeType !== 1) return ''; // Only elements
        
        const el = node as Element;
        if (el.tagName === 'BODY') return '';

        let index = 1;
        let sibling = el.previousElementSibling;
        while(sibling) {
            if (sibling.tagName === el.tagName) index++;
            sibling = sibling.previousElementSibling;
        }
        
        return `${getSimpleXPath(el.parentNode)}/${el.tagName.toLowerCase()}[${index}]`;
    };

    const handleInteraction = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      
      if (!editableTags.includes(target.tagName) && !target.innerText) return;

      // Generate selected payload
      const payload: SelectedElement = {
        tagName: target.tagName,
        xpath: getSimpleXPath(target),
        text: target.innerText,
      };

      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        const computedStyle = window.getComputedStyle(img);
        
        payload.src = img.src;
        payload.alt = img.alt;
        payload.objectFit = img.style.objectFit || 'initial';
        payload.objectPosition = img.style.objectPosition || '50% 50%';
        // Prefer inline style for transform origin as computed returns pixels
        payload.transformOrigin = img.style.transformOrigin || '50% 50%';
        
        payload.styleHeight = img.style.height;
        payload.computedHeight = computedStyle.height;
        payload.styleWidth = img.style.width;
        payload.computedWidth = computedStyle.width;

        // Extract scale from transform matrix
        let scale = 1;
        const transform = computedStyle.transform;
        if (transform && transform !== 'none') {
             // Matrix format: matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)
             const values = transform.split('(')[1].split(')')[0].split(',');
             const a = parseFloat(values[0]); // scaleX
             scale = a;
        }
        payload.scale = scale;
      }
      
      // Check for link on self or parent
      let anchor = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a');
      if (anchor) {
        payload.href = anchor.href;
      }
      
      // Send up
      onSelectElement(payload);
    };

    // Attach listeners
    doc.body.addEventListener('click', handleInteraction);
    
    // Mark elements
    const allElements = doc.body.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as HTMLElement;
        if (editableTags.includes(el.tagName)) {
             el.setAttribute('data-prism-editable', 'true');
        }
    }
  };

  useEffect(() => {
    // Every time HTML content changes, we reload the iframe doc
    const iframe = iframeRef.current;
    if (iframe) {
        setLoading(true);
        iframe.srcdoc = htmlContent;
    }
  }, [htmlContent]);

  const handleLoad = () => {
    setLoading(false);
    injectInteractionScript();
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm overflow-hidden relative">
        <iframe
            ref={iframeRef}
            title="Email Preview"
            className="w-full h-full border-0"
            onLoad={handleLoad}
            sandbox="allow-same-origin allow-scripts" 
        />
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <span className="text-slate-400 animate-pulse">Loading preview...</span>
            </div>
        )}
    </div>
  );
};