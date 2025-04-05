import { UkComplianceMCPService } from './uk-compliance-mcp.service';
import { 
  UkComplianceMCP, 
  UkComplianceResult, 
  UkComplianceRequirement,
  UkRegulation,
  UkCertification,
  UkRestriction
} from './uk-compliance-mcp.interface';

export { 
  UkComplianceMCPService,
  UkComplianceMCP,
  UkComplianceResult,
  UkComplianceRequirement,
  UkRegulation,
  UkCertification,
  UkRestriction
};

export default new UkComplianceMCPService(); 