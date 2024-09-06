import React from 'react';
import { Editor, EditorState, ContentState, convertFromRaw, convertToRaw, getDefaultKeyBinding, RichUtils } from 'draft-js';
import './RichText.css';
import '../../node_modules/draft-js/dist/Draft.css';
import html2pdf from 'html2pdf.js';
import LLMComponent from './LLMComponent';

// Proposal outlines
const PROPOSAL_OUTLINES = {
    executiveSummary: "Executive Summary\n\nAugierAI aims to enhance the efficiency of small to mid-sized businesses in accessing government opportunities and generating proposals. This proposal outlines a strategy for leveraging AugierAI’s expertise to simplify the process, making it easier for businesses to identify relevant government contracts and create high-quality proposals. Our goal is to streamline the proposal process, improve success rates, and support business growth through effective government engagements.\n\n",
    introduction: "Introduction\n\nSmall to mid-sized businesses often face challenges in navigating the complex landscape of government opportunities. The process of finding relevant contracts and preparing proposals can be time-consuming and cumbersome. AugierAI offers a solution by providing targeted assistance and advanced tools to streamline these processes, ultimately helping businesses secure valuable government contracts and opportunities.\n\n",
    problemStatement: "Problem Statement\n\nSMBs frequently encounter difficulties in identifying and responding to government opportunities due to the overwhelming volume of available contracts and the intricate nature of proposal requirements.\n Evidence indicates that many SMBs miss out on opportunities or submit unsuccessful proposals due to these challenges.\n This problem affects SMBs by limiting their potential for growth and profitability in the government contracting arena.\n\n",
    proposedSolution: "Proposed Solution\n\nAugierAI proposes an integrated solution that combines a government opportunity discovery platform with an advanced proposal generation tool.\n The platform will aggregate and categorize relevant government contracts, while the proposal generation tool will assist businesses in drafting and formatting proposals to meet specific requirements.\n The benefits include streamlined opportunity identification, improved proposal quality, and increased success rates for SMBs.\n\n",
    implementationPlan: "Implementation Plan\n\nThe implementation plan consists of several key phases:\nDevelopment and Testing: Build and refine the opportunity discovery platform and proposal generation tool (3 months).\nPilot Program: Launch a pilot with selected SMBs to gather feedback and make adjustments (2 months).\nFull Deployment: Roll out the solution to a wider audience (4 months).\nOngoing Support and Evaluation: Provide ongoing support and evaluate the solution’s effectiveness (continuous).\n\n",
    budgetAndFinance: "Budget and Financial Plan\n\nThe budget includes:\nDevelopment Costs: $200,000 for software development and testing.\nPilot Program: $50,000 for pilot implementation and feedback collection.\nFull Deployment: $150,000 for marketing, training, and support.\nOngoing Support: $75,000 annually.\n\nFunding sources will come from venture capital, government grants, and strategic partnerships.\n A cost-benefit analysis demonstrates that the anticipated increase in contract wins for SMBs will offset the initial investment.\n",
    evaluationsAndMetric: "Evaluation and Metrics\n\nSuccess will be evaluated based on:\nThe number of opportunities identified and pursued by SMBs.\nThe quality and success rate of submitted proposals.\nUser satisfaction and feedback.\n\nMetrics will be measured through platform usage statistics, proposal success rates, and customer surveys.\n Progress will be monitored with regular reports and performance reviews.\n\n",
    conclusion: "Conclusion\n\nIn conclusion, AugierAI’s proposal offers a comprehensive solution to improve SMB access to government opportunities and enhance proposal success.\n The next steps involve finalizing development, initiating the pilot program, and securing funding for full deployment.\n This solution aims to empower SMBs with the tools and support needed to succeed in the competitive government contracting landscape.\n\n",
};

class RichTextEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty(),
            selectedOutline: ''
        };

        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => this.setState({ editorState });

        this.handleKeyCommand = this._handleKeyCommand.bind(this);
        this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
        this.toggleBlockType = this._toggleBlockType.bind(this);
        this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
        this.toggleAlignment = this._toggleAlignment.bind(this);
        this.selectProposalOutline = this._selectProposalOutline.bind(this);
        this.exportToPDF = this._exportToPDF.bind(this);
    }

    _handleKeyCommand(command, editorState) {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    _mapKeyToEditorCommand(e) {
        if (e.keyCode === 9 /* TAB */) {
            const newEditorState = RichUtils.onTab(
                e,
                this.state.editorState,
                4 /* maxDepth */
            );
            if (newEditorState !== this.state.editorState) {
                this.onChange(newEditorState);
            }
            return;
        }
        return getDefaultKeyBinding(e);
    }

    _toggleBlockType(blockType) {
        this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle));
    }

    _toggleAlignment(alignment) {
        this.onChange(RichUtils.toggleBlockType(this.state.editorState, alignment));
    }

    _selectProposalOutline(outlineKey) {
      const content = PROPOSAL_OUTLINES[outlineKey] || '';
      const currentContent = this.state.editorState.getCurrentContent();
      const currentContentAsText = currentContent.getPlainText();
      
      // Append the new content to the existing content
      const newContentText = currentContentAsText + '\n' + content;
  
      // Create a new content state with the appended text
      const newContentState = ContentState.createFromText(newContentText);
      
      // Create a new editor state with the updated content
      const newEditorState = EditorState.createWithContent(newContentState);
  
      this.setState({
          editorState: newEditorState,
          selectedOutline: outlineKey
      });
  }
  
  _exportToPDF() {
    const contentState = this.state.editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    const contentHTML = this._convertContentToHTML(rawContent);

    const element = document.createElement('div');
    element.innerHTML = contentHTML;

    // Apply styles to ensure proper formatting
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.fontSize = '12pt';

    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5], // Margins in inches: [top, left, bottom, right]
        filename: 'document.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
}

_convertContentToHTML(content) {
    return content.blocks.map(block => {
        switch (block.type) {
            case 'header-one':
                return `<h1>${block.text}</h1>`;
            case 'header-two':
                return `<h2>${block.text}</h2>`;
            case 'header-three':
                return `<h3>${block.text}</h3>`;
            case 'header-four':
                return `<h4>${block.text}</h4>`;
            case 'header-five':
                return `<h5>${block.text}</h5>`;
            case 'header-six':
                return `<h6>${block.text}</h6>`;
            case 'blockquote':
                return `<blockquote>${block.text}</blockquote>`;
            case 'unordered-list-item':
                return `<ul><li>${block.text}</li></ul>`;
            case 'ordered-list-item':
                return `<ol><li>${block.text}</li></ol>`;
            case 'code-block':
                return `<pre><code>${block.text}</code></pre>`;
            default:
                return `<p>${block.text}</p>`;
        }
    }).join('');
}


    render() {
        const { editorState, selectedOutline } = this.state;
        const editorContent = convertToRaw(editorState.getCurrentContent());

        let className = 'RichEditor-editor';
        const contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' RichEditor-hidePlaceholder';
            }
        }

        return (
            <div className="RichEditor-container">
                <div className="RichEditor-sidebar">
                    <ProposalOutlineList
                        selectedOutline={selectedOutline}
                        onSelect={this.selectProposalOutline}
                    />
                    <BlockStyleControls editorState={editorState} onToggle={this.toggleBlockType} />
                    <InlineStyleControls editorState={editorState} onToggle={this.toggleInlineStyle} />
                    <AlignmentControls editorState={editorState} onToggle={this.toggleAlignment} />
                    <button className="RichEditor-button" onClick={this.exportToPDF}>Export to PDF</button>
                </div>
                <div className="RichEditor-editorContainer">
                    <div className={className} onClick={this.focus}>
                        <Editor
                            blockStyleFn={getBlockStyle}
                            customStyleMap={styleMap}
                            editorState={editorState}
                            handleKeyCommand={this.handleKeyCommand}
                            keyBindingFn={this.mapKeyToEditorCommand}
                            onChange={this.onChange}
                            placeholder="Tell a story..."
                            ref="editor"
                            spellCheck={true}
                        />
                    </div>
                </div>
                <div className="RichEditor-llm">
                    <LLMComponent editorContent={editorContent} />
                </div>
            </div>
        );
    }
}

const styleMap = {
    CODE: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
        fontSize: 16,
        padding: 2,
    },
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote':
            return 'RichEditor-blockquote';
        case 'align-left':
            return 'RichEditor-align-left';
        case 'align-center':
            return 'RichEditor-align-center';
        case 'align-right':
            return 'RichEditor-align-right';
        case 'align-justify':
            return 'RichEditor-align-justify';
        default:
            return null;
    }
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
    }

    render() {
        let className = 'RichEditor-styleButton';
        if (this.props.active) {
            className += ' RichEditor-activeButton';
        }
        return (
            <span className={className} onMouseDown={this.onToggle}>
                {this.props.label}
            </span>
        );
    }
}

const BLOCK_TYPES = [
    { label: 'H1', style: 'header-one' },
    { label: 'H2', style: 'header-two' },
    { label: 'H3', style: 'header-three' },
    { label: 'H4', style: 'header-four' },
    { label: 'H5', style: 'header-five' },
    { label: 'H6', style: 'header-six' },
    { label: 'Blockquote', style: 'blockquote' },
    { label: 'UL', style: 'unordered-list-item' },
    { label: 'OL', style: 'ordered-list-item' },
    { label: 'Code Block', style: 'code-block' },
];

const BlockStyleControls = (props) => {
    const { editorState } = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <div className="RichEditor-controls">
            {BLOCK_TYPES.map((type) => (
                <StyleButton
                    key={type.label}
                    active={type.style === blockType}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            ))}
        </div>
    );
};

const INLINE_STYLES = [
    { label: 'Bold', style: 'BOLD' },
    { label: 'Italic', style: 'ITALIC' },
    { label: 'Underline', style: 'UNDERLINE' },
    { label: 'Monospace', style: 'CODE' },
];

const InlineStyleControls = (props) => {
    const currentStyle = props.editorState.getCurrentInlineStyle();
    return (
        
        <div className="RichEditor-controls">
             

            {INLINE_STYLES.map((type) => (
                <StyleButton
                    key={type.label}
                    active={currentStyle.has(type.style)}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            ))}
        </div>
    );
};

const ALIGNMENTS = [
    { label: 'Left', style: 'align-left' },
    { label: 'Center', style: 'align-center' },
    { label: 'Right', style: 'align-right' },
    { label: 'Justify', style: 'align-justify' },
];

const AlignmentControls = (props) => {
    const { editorState } = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <div className="RichEditor-controls">
            {ALIGNMENTS.map((alignment) => (
                <StyleButton
                    key={alignment.label}
                    active={alignment.style === blockType}
                    label={alignment.label}
                    onToggle={props.onToggle}
                    style={alignment.style}
                />
            ))}
        </div>
    );
};

const ProposalOutlineList = (props) => {
    return (
        <div className="ProposalOutlineList">
            <h3>Proposal Outlines</h3>
            <ul>
                {Object.keys(PROPOSAL_OUTLINES).map((key) => (
                    <li
                        key={key}
                        className={props.selectedOutline === key ? 'selected' : ''}
                        onClick={() => props.onSelect(key)}
                    >
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RichTextEditor;
