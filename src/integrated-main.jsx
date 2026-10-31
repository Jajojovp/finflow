// The existing workspace keeps its presentation and navigation; React renders
// the original financial services within its Results section.
import './workspace/styles.css';
import './workspace/intelligence.css';
import './workspace/downloads.css';
import './workspace/auth.css';
import { initAuth } from './workspace/auth.mjs';
initAuth().then(() => import('./workspace/app.mjs'));
