import React from 'react';
import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  showTooltip?: boolean;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  size = 'md',
  showLabel = true,
  showIcon = true,
  showTooltip = false
}) => {
  // Round score for display
  const roundedScore = Math.round(score);
  
  // Get confidence level
  const getConfidenceLevel = (): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };
  
  // Get classes based on confidence level and size
  const getClasses = (): { container: string; text: string; icon: string } => {
    const level = getConfidenceLevel();
    
    // Base styles
    let containerClass = 'flex items-center rounded-full ';
    let textClass = 'font-medium ';
    let iconClass = '';
    
    // Size-specific styles
    if (size === 'sm') {
      containerClass += 'px-2 py-0.5 ';
      textClass += 'text-xs ';
      iconClass += 'w-3 h-3 mr-1 ';
    } else if (size === 'md') {
      containerClass += 'px-3 py-1 ';
      textClass += 'text-sm ';
      iconClass += 'w-4 h-4 mr-1.5 ';
    } else {
      containerClass += 'px-4 py-1.5 ';
      textClass += 'text-base ';
      iconClass += 'w-5 h-5 mr-2 ';
    }
    
    // Level-specific styles
    if (level === 'high') {
      containerClass += 'bg-green-100 ';
      textClass += 'text-green-800 ';
      iconClass += 'text-green-600 ';
    } else if (level === 'medium') {
      containerClass += 'bg-yellow-100 ';
      textClass += 'text-yellow-800 ';
      iconClass += 'text-yellow-600 ';
    } else {
      containerClass += 'bg-red-100 ';
      textClass += 'text-red-800 ';
      iconClass += 'text-red-600 ';
    }
    
    return {
      container: containerClass.trim(),
      text: textClass.trim(),
      icon: iconClass.trim()
    };
  };
  
  // Get confidence icon
  const getConfidenceIcon = () => {
    const level = getConfidenceLevel();
    const classes = getClasses();
    
    if (level === 'high') {
      return <CheckCircle className={classes.icon} />;
    } else if (level === 'medium') {
      return <AlertTriangle className={classes.icon} />;
    } else {
      return <AlertTriangle className={classes.icon} />;
    }
  };
  
  // Get confidence label
  const getConfidenceLabel = () => {
    const level = getConfidenceLevel();
    
    if (level === 'high') {
      return 'High Confidence';
    } else if (level === 'medium') {
      return 'Medium Confidence';
    } else {
      return 'Low Confidence';
    }
  };
  
  const classes = getClasses();
  
  return (
    <div className={classes.container}>
      {showIcon && getConfidenceIcon()}
      
      <span className={classes.text}>
        {showLabel ? getConfidenceLabel() : ''}
        {showLabel && roundedScore > 0 ? ': ' : ''}
        {roundedScore > 0 ? `${roundedScore}%` : ''}
      </span>
      
      {showTooltip && (
        <div className="ml-1 cursor-help relative group">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Confidence indicates how likely this classification is correct based on AI analysis.
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfidenceIndicator; 