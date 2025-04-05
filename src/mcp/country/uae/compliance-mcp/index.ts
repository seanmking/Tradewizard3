import { UaeComplianceMCPService } from './uae-compliance-mcp.service';
import { 
  UaeComplianceMCP, 
  UaeComplianceResult, 
  UaeComplianceRequirement,
  UaeRegulation,
  UaeCertification,
  UaeRestriction,
  UaeFreeZoneRequirement
} from './uae-compliance-mcp.interface';

export { 
  UaeComplianceMCPService,
  UaeComplianceMCP,
  UaeComplianceResult,
  UaeComplianceRequirement,
  UaeRegulation,
  UaeCertification,
  UaeRestriction,
  UaeFreeZoneRequirement
};

export default new UaeComplianceMCPService(); 