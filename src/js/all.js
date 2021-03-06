import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import shell from 'highlight.js/lib/languages/shell';
import scala from 'highlight.js/lib/languages/scala';
import { register } from './navbar-toggle';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('scala', scala);
hljs.initHighlightingOnLoad();
register();
