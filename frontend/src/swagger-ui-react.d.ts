declare module 'swagger-ui-react' {
  import * as React from 'react';
  export interface SwaggerUIProps {
    url?: string;
    spec?: any;
    layout?: string;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    supportedSubmitMethods?: string[];
    plugins?: any[];
  }
  const SwaggerUI: React.ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

declare module 'swagger-ui-react/swagger-ui.css' {
  const content: any;
  export default content;
}
