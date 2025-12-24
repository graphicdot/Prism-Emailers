// A simple way to identify elements in the DOM
export const getElementByXpath = (path: string, root: Document | Element): Element | null => {
  const evaluator = new XPathEvaluator();
  const result = evaluator.evaluate(path, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue as Element;
};

// Generate a unique path for an element to find it again later
export const getXpathForElement = (element: Element, root: Element): string => {
    if (element === root) return '';
    
    // If element has an ID, use it for shorter path (optional, but robust)
    if (element.id !== '') return `//*[@id="${element.id}"]`;

    const getPath = (node: Node, path: string = ''): string => {
        if (!node.parentNode) return path;
        
        const tagName = (node as Element).tagName;
        if (!tagName) return path;

        // Calculate index
        let index = 1;
        let sibling = node.previousSibling;
        while (sibling) {
            if (sibling.nodeType === 1 && (sibling as Element).tagName === tagName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }

        const currentPart = `/${tagName.toLowerCase()}[${index}]`;
        
        if (node.parentNode === root || (node.parentNode as Element).tagName === 'BODY') { // Stop at body or root
             return currentPart + path;
        }
        
        return getPath(node.parentNode, currentPart + path);
    };

    return getPath(element);
};

export const updateHtmlContent = (
  htmlString: string,
  xpath: string,
  updates: { 
      tagName?: string;
      text?: string; 
      src?: string; 
      href?: string; 
      alt?: string; 
      objectFit?: string;
      objectPosition?: string;
      height?: string;
      width?: string;
      scale?: number;
  }
): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  try {
      // 1. Attempt to find the element using the provided XPath
      let element: HTMLElement | null = null;
      let result = doc.evaluate(
          xpath.startsWith('//') ? xpath : `/html/body${xpath}`, 
          doc, 
          null, 
          XPathResult.FIRST_ORDERED_NODE_TYPE, 
          null
      );
      element = result.singleNodeValue as HTMLElement;

      // 2. Recovery Strategy
      if (!element) {
          const wrappedXpath = (xpath.startsWith('//') ? xpath : `/html/body${xpath}`)
            .replace(/(.*)\/([a-z0-9]+)(\[\d+\])$/i, '$1/a/$2$3');
          
          const retryResult = doc.evaluate(
              wrappedXpath,
              doc,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
          );
          element = retryResult.singleNodeValue as HTMLElement;
      }
      
      if (element) {
          // Handle Tag Name Change first (as it replaces the element)
          if (updates.tagName && updates.tagName.toUpperCase() !== element.tagName.toUpperCase()) {
              const newTag = updates.tagName;
              const newElement = doc.createElement(newTag);
              
              // Copy attributes
              for (let i = 0; i < element.attributes.length; i++) {
                  const attr = element.attributes[i];
                  newElement.setAttribute(attr.name, attr.value);
              }
              
              // Copy inner content
              newElement.innerHTML = element.innerHTML;
              
              // Replace in DOM
              element.parentNode?.replaceChild(newElement, element);
              element = newElement; // Update reference for further updates
          }

          if (updates.text !== undefined) element.innerText = updates.text;
          
          if (element.tagName === 'IMG') {
              if (updates.src !== undefined) element.setAttribute('src', updates.src);
              if (updates.alt !== undefined) element.setAttribute('alt', updates.alt);
              
              if (updates.objectFit !== undefined) {
                 element.style.objectFit = updates.objectFit;
              }
              
              // Apply position to both object-position and transform-origin
              // This ensures consistency whether panning via box model or zoom
              if (updates.objectPosition !== undefined) {
                 element.style.objectPosition = updates.objectPosition;
                 element.style.transformOrigin = updates.objectPosition;
              }
              
              if (updates.height !== undefined) {
                 element.style.height = updates.height;
                 // Also update attribute height if it exists to keep consistency
                 if (updates.height === 'auto') {
                     element.removeAttribute('height');
                 } else {
                     element.setAttribute('height', updates.height.replace('px', ''));
                 }
              }
              
              if (updates.width !== undefined) {
                 element.style.width = updates.width;
                 if (updates.width === 'auto') {
                     element.removeAttribute('width');
                 } else {
                     element.setAttribute('width', updates.width.replace('px', ''));
                 }
              }

              if (updates.scale !== undefined) {
                  // If scale is 1, remove transform to keep HTML clean
                  if (updates.scale === 1) {
                      element.style.transform = '';
                      // We don't remove parent overflow hidden automatically because 
                      // it might be set by other things.
                  } else {
                      element.style.transform = `scale(${updates.scale})`;
                      // Ensure parent clips the scaled image
                      if (element.parentElement) {
                          element.parentElement.style.overflow = 'hidden';
                          element.parentElement.style.display = 'block'; 
                      }
                  }
              }
          }
          
          if (updates.href !== undefined) {
             const parent = element.parentElement;
             const isSelfAnchor = element.tagName === 'A';
             const isParentAnchor = parent && parent.tagName === 'A';

             if (isSelfAnchor) {
                 element.setAttribute('href', updates.href);
             } else if (isParentAnchor) {
                 parent.setAttribute('href', updates.href);
             } else if (updates.href) {
                 const a = doc.createElement('a');
                 a.setAttribute('href', updates.href);
                 if (element.parentNode) {
                    element.parentNode.insertBefore(a, element);
                    a.appendChild(element);
                 }
             }
          }
      }
      
      return doc.documentElement.outerHTML;
  } catch (e) {
      console.error("Failed to update HTML", e);
      return htmlString;
  }
};