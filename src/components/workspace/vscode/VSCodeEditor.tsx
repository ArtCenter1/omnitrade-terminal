import React, { useState } from 'react';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { ViewProvider } from '@/contexts/ViewContext';
import { PanelProvider } from '@/contexts/PanelContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { useEditorContext } from '@/contexts/EditorContext';

interface VSCodeEditorProps {
  id: string;
  title: string;
  componentState: {
    fileType: string;
    fileName: string;
  };
}

// Sample code snippets for different file types
const getSampleCode = (fileType: string) => {
  switch (fileType) {
    case 'javascript':
      return `// Main JavaScript file
function main() {
  const data = fetchData();
  
  if (data) {
    processData(data);
  }
  
  return true;
}

class Component {
  constructor(props) {
    this.state = {
      loading: true,
      data: null
    };
  }
  
  render() {
    return '<div>Hello World</div>';
  }
}

// Export functions
export { main, Component };`;

    case 'html':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>My Website</h1>
    <nav>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section>
      <h2>Welcome</h2>
      <p>This is a sample website.</p>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2023 My Website</p>
  </footer>
  
  <script src="main.js"></script>
</body>
</html>`;

    case 'css':
      return `/* Main styles */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  margin: 0;
  padding: 0;
  background-color: #f4f4f4;
}

header {
  background-color: #35424a;
  color: white;
  padding: 20px;
  border-bottom: 3px solid #e8491d;
}

nav ul {
  display: flex;
  list-style: none;
  padding: 0;
}

nav ul li {
  margin-right: 20px;
}

nav a {
  color: white;
  text-decoration: none;
}

main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

footer {
  background-color: #35424a;
  color: white;
  text-align: center;
  padding: 20px;
  margin-top: 40px;
}`;

    default:
      return `// No content available for this file type`;
  }
};

// Inner component that uses the context
const EditorContent: React.FC<VSCodeEditorProps> = ({
  id,
  title,
  componentState,
}) => {
  const { fileType, fileName } = componentState;
  const [code, setCode] = useState(getSampleCode(fileType));

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      {/* Editor Tabs */}
      <div className="editor-tabs h-10 flex items-center bg-[#252526] border-b border-[#1e1e1e]">
        <div className="editor-tab flex items-center px-3 h-full cursor-pointer bg-[#1e1e1e] border-t-2 border-t-[#007acc]">
          <span className="editor-title">{fileName}</span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="editor-content flex-1 overflow-auto">
        <pre className="p-4 font-mono text-sm whitespace-pre-wrap">{code}</pre>
      </div>
    </div>
  );
};

// Wrapper component that provides the context
const VSCodeEditor: React.FC<VSCodeEditorProps> = (props) => {
  return (
    <LayoutProvider>
      <ViewProvider>
        <EditorProvider>
          <PanelProvider>
            <EditorContent {...props} />
          </PanelProvider>
        </EditorProvider>
      </ViewProvider>
    </LayoutProvider>
  );
};

export default VSCodeEditor;
