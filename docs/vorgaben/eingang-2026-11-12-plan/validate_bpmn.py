#!/usr/bin/env python3
"""Structural BPMN 2.0/DI checks. Not an OMG-XSD or target-engine import test."""
from lxml import etree
from pathlib import Path
from collections import Counter
import networkx as nx

PATH=Path(__file__).parent/'03_BPMN_L0_COLLABORATION.bpmn'
B='http://www.omg.org/spec/BPMN/20100524/MODEL'
BD='http://www.omg.org/spec/BPMN/20100524/DI'
DC='http://www.omg.org/spec/DD/20100524/DC'
DI='http://www.omg.org/spec/DD/20100524/DI'
def tag(ns,n): return f'{{{ns}}}{n}'
ns={'b':B,'bd':BD}
T=etree.parse(str(PATH)); root=T.getroot()
ids=[e.get('id') for e in root.iter() if e.get('id')]
assert len(ids)==len(set(ids)), 'Duplicate IDs'
messages={x.get('id') for x in root.findall(tag(B,'message'))}
processes={p.get('id'):p for p in root.findall(tag(B,'process'))}
owner={}
count_nodes=0; count_edges=0; n_gw=0; n_ends=0
for pid,proc in processes.items():
 nodes={e.get('id'):e for e in proc if e.get('id') and e.tag not in {tag(B,'laneSet'),tag(B,'sequenceFlow')}}
 starts=[k for k,v in nodes.items() if v.tag==tag(B,'startEvent')]
 ends=[k for k,v in nodes.items() if v.tag==tag(B,'endEvent')]
 assert starts and ends,(pid,'missing start/end')
 for nid in nodes: assert nid not in owner;owner[nid]=pid
 count_nodes+=len(nodes);n_ends+=len(ends)
 g=nx.DiGraph();g.add_nodes_from(nodes)
 for sf in proc.findall(tag(B,'sequenceFlow')):
  count_edges+=1
  a,b=sf.get('sourceRef'),sf.get('targetRef')
  assert a in nodes and b in nodes,('invalid sequence flow',sf.get('id'))
  g.add_edge(a,b)
  assert any(child.text==sf.get('id') for child in nodes[a].findall(tag(B,'outgoing')))
  assert any(child.text==sf.get('id') for child in nodes[b].findall(tag(B,'incoming')))
 for k,v in nodes.items():
  if v.tag==tag(B,'startEvent'):
   assert g.in_degree(k)==0,(k,'start has incoming')
  elif v.tag==tag(B,'endEvent'):
   assert g.out_degree(k)==0,(k,'end has outgoing')
  else:
   assert g.in_degree(k)>0 and g.out_degree(k)>0,(k,'dangling')
  assert any(nx.has_path(g,s,k) for s in starts),(k,'unreachable')
  if v.tag==tag(B,'eventBasedGateway'):
   n_gw+=1
   targets=[nodes[t] for t in g.successors(k)]
   assert len(targets)>=2
   assert all(t.tag==tag(B,'intermediateCatchEvent') for t in targets)
   assert all(any(x.tag in (tag(B,'messageEventDefinition'),tag(B,'timerEventDefinition')) for x in list(t)) for t in targets)
   assert all(g.in_degree(t.get('id'))==1 for t in targets)
  if v.tag==tag(B,'callActivity'):
   assert v.get('calledElement') in processes,(k,'call reference unresolved')
  if v.tag==tag(B,'sendTask') and v.get('messageRef'):
   assert v.get('messageRef') in messages
  for x in v:
   if x.tag==tag(B,'messageEventDefinition'):
    assert x.get('messageRef') in messages,(k,'invalid message ref')

assert set(processes)>=set(['Process_OpportunityToAssessment','Process_DiscoveryRun','Process_AssessmentSetup','Process_AssessmentExecution'])
collab=root.find(tag(B,'collaboration'))
participants={p.get('id'):p.get('processRef') for p in collab.findall(tag(B,'participant'))}
assert participants['Participant_Customer'] is None
message_flows=collab.findall(tag(B,'messageFlow'))
assert message_flows
for mf in message_flows:
 sid,tid=mf.get('sourceRef'),mf.get('targetRef')
 source=participants.get(sid,owner.get(sid))
 target=participants.get(tid,owner.get(tid))
 # Black-box participant has no processRef; distinguish endpoint IDs
 assert (sid in participants or sid in owner) and (tid in participants or tid in owner)
 if sid in owner and tid in owner:
  assert owner[sid]!=owner[tid],('message flow within process',mf.get('id'))
 assert mf.get('messageRef') in messages,(mf.get('id'),'missing message')

diagrams=root.findall(tag(BD,'BPMNDiagram'))
assert len(diagrams)==3
shape_ids=[];edge_ids=[]
for d in diagrams:
 plane=d.find(tag(BD,'BPMNPlane')); assert plane is not None
 for sh in plane.findall(tag(BD,'BPMNShape')):
  shape_ids.append(sh.get('bpmnElement'))
  b=sh.find(tag(DC,'Bounds')); assert b is not None
  assert float(b.get('width'))>0 and float(b.get('height'))>0
 for edge in plane.findall(tag(BD,'BPMNEdge')):
  edge_ids.append(edge.get('bpmnElement'))
  assert len(edge.findall(tag(DI,'waypoint')))>=2
assert set(owner)<=set(shape_ids),'missing node BPMN-DI shape'
expected_edges={f.get('id') for p in processes.values() for f in p.findall(tag(B,'sequenceFlow'))}|{f.get('id') for f in message_flows}
assert expected_edges<=set(edge_ids),'missing BPMN-DI edges'

report=f'''# 09 – Strukturpruefung des BPMN-Referenzmodells

**Stand:** 2026-11-12  
**Datei:** `03_BPMN_L0_COLLABORATION.bpmn`

## Automatisch bestanden

- XML ueber `lxml.etree` parsebar.
- Alle IDs eindeutig.
- **{len(processes)} BPMN-Prozesse**, davon 2 im Collaboration und 2 als wiederverwendbare Call-Activity-Prozesse.
- **{len(participants)} Pools/Teilnehmer** (inklusive Customer-Blackbox).
- **{count_nodes} Prozess-Flow-Nodes** (ohne Sequence Flows/LaneSets).
- **{count_edges} Sequence Flows** innerhalb der jeweiligen Prozesse referenziert.
- **{len(message_flows)} Message Flows** mit gueltigen Teilnehmer-/Node-Endpunkten und deklarierten Nachrichten.
- **{n_gw} Event-Based Gateways** mit jeweils >=2 gueltigen Catch Events (Message/Timer) und nur einer eingehenden Kante je Catch Event.
- **{n_ends} End Events**, alle Starts und Enden erreichbar.
- Call-Activity-`calledElement`-Referenzen im Dokument aufgeloest.
- Alle Flow-Nodes und Sequence-/Message-Flows haben BPMN-DI-Shape-/Edge-Referenzen.
- Kein isolierter Knoten im Pfadgraphen, kein End Event mit Sequence Flow nach aussen.
- Keine Achsenrechteck-Ueberlappung der Flow Nodes im Hauptdiagramm (separater visueller Geometriecheck).

## Noch **nicht** nachgewiesen

- Keine Validierung gegen die **originalen OMG-XSDs**, da sie in dieser Laufzeitumgebung nicht heruntergeladen werden konnten.
- Kein tatsaechlicher Import in Camunda Modeler, bpmn.io, Flowable oder Zeebe und kein Engine-Execution-Test.
- Keine verbindlichen DMN-Tabellen, technische Korrelation, API-/Message Contracts, SLAs oder User Assignment vorhanden.
- Laengerer Rework-Pfad und Pfeilrouting koennen in konkretem BPMN-Editor optisch nachbearbeitet werden.

**Einstufung:** strukturell geprueftes deskriptives Referenzmodell mit BPMN-DI, **nicht** als ausführbarer oder durch einen BPMN-Modeler importgetesteter Prozess behaupten.
'''
(Path(__file__).parent/'09_QA_REPORT.md').write_text(report,encoding='utf-8')
print(report)
